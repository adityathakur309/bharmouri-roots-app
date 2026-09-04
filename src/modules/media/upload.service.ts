import { randomUUID } from "crypto";
import sharp from "sharp";
import { ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import type { MediaPurpose } from "@/lib/db/models/media.model";
import { writeUploadFile } from "@/lib/storage/local-media";
import { mediaRepository } from "./media.repository";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_QUALITY = 82;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type UploadPurpose = MediaPurpose;

export interface UploadOptions {
  /** Logical bucket for future filtering (products, banners, avatars, …) */
  purpose?: UploadPurpose;
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Convert JPEG/PNG to WebP after optimization (default true). GIF is never converted. */
  convertToWebp?: boolean;
}

export interface UploadResult {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  purpose: UploadPurpose;
}

interface DetectedImage {
  mimeType: string;
  extension: string;
}

function detectImageType(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 12) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mimeType: "image/png", extension: "png" };
  }

  // GIF
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { mimeType: "image/gif", extension: "gif" };
  }

  // WEBP (RIFF....WEBP)
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }

  return null;
}

async function readToBuffer(
  input: File | Blob | Buffer | ArrayBuffer
): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof ArrayBuffer) return Buffer.from(input);
  return Buffer.from(await input.arrayBuffer());
}

function hasClaimedMime(
  input: File | Buffer | ArrayBuffer | Blob
): input is File | Blob {
  return typeof Blob !== "undefined" && input instanceof Blob;
}

function claimedMime(file: File | Blob, detected: DetectedImage): void {
  if (!file.type) return;
  const normalized = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!ALLOWED_MIME.has(normalized)) {
    throw new ValidationError("Only JPEG, PNG, WebP, and GIF images are allowed");
  }
  // Declared MIME must match magic bytes (prevents polyglot uploads)
  if (normalized !== detected.mimeType) {
    throw new ValidationError("File content does not match declared MIME type");
  }
}

function createSharpPipeline(buffer: Buffer) {
  // failOn none + regenerate help with screenshots / odd colour profiles
  return sharp(buffer, { failOn: "none", sequentialRead: true }).rotate();
}

async function optimizeImage(
  buffer: Buffer,
  detected: DetectedImage,
  options: Required<
    Pick<UploadOptions, "maxWidth" | "maxHeight" | "quality" | "convertToWebp">
  >
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  // Preserve animated GIFs — sharp would flatten frames
  if (detected.mimeType === "image/gif") {
    return {
      buffer,
      mimeType: detected.mimeType,
      extension: detected.extension,
    };
  }

  // Read metadata from a separate instance — reusing a pipeline after
  // metadata() can fail on some PNGs ("colourspace: parameter space not set").
  const meta = await createSharpPipeline(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  let pipeline = createSharpPipeline(buffer);

  if (width > options.maxWidth || height > options.maxHeight) {
    pipeline = pipeline.resize({
      width: options.maxWidth,
      height: options.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (options.convertToWebp || detected.mimeType === "image/webp") {
    const out = await pipeline.webp({ quality: options.quality }).toBuffer();
    return { buffer: out, mimeType: "image/webp", extension: "webp" };
  }

  if (detected.mimeType === "image/png") {
    const out = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    return { buffer: out, mimeType: "image/png", extension: "png" };
  }

  const out = await pipeline.jpeg({ quality: options.quality, mozjpeg: true }).toBuffer();
  return { buffer: out, mimeType: "image/jpeg", extension: "jpg" };
}

/** Vercel (and similar) cannot persist files under public/uploads. */
function prefersMongoStorage(): boolean {
  if (process.env.UPLOAD_STORAGE === "mongodb") return true;
  if (process.env.UPLOAD_STORAGE === "disk") return false;
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

/**
 * Image upload pipeline:
 * validate → optimize in memory → store on disk (local/VPS) or MongoDB (Vercel).
 *
 * Returns `/uploads/...` on disk, or `/api/media/:id` on serverless.
 */
export async function uploadImage(
  input: File | Blob | Buffer | ArrayBuffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const purpose: UploadPurpose = options.purpose ?? "general";
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const convertToWebp = options.convertToWebp ?? true;

  const raw = await readToBuffer(input);

  if (raw.length === 0) {
    throw new ValidationError("Empty file");
  }

  if (raw.length > maxBytes) {
    throw new ValidationError(`File must be under ${Math.round(maxBytes / (1024 * 1024))}MB`);
  }

  const detected = detectImageType(raw);
  if (!detected || !ALLOWED_MIME.has(detected.mimeType)) {
    throw new ValidationError("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  if (hasClaimedMime(input)) {
    claimedMime(input, detected);
  }

  let optimized: { buffer: Buffer; mimeType: string; extension: string };
  try {
    optimized = await optimizeImage(raw, detected, {
      maxWidth,
      maxHeight,
      quality,
      convertToWebp,
    });
  } catch (error) {
    logger.error("Image optimization failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new ValidationError("Invalid or corrupt image file");
  }

  if (optimized.buffer.length > maxBytes) {
    throw new ValidationError("Optimized image exceeds size limit");
  }

  const filename = `${randomUUID()}.${optimized.extension}`;
  const useMongo = prefersMongoStorage();

  let relativePath: string | undefined;
  let publicUrl: string | undefined;

  if (!useMongo) {
    try {
      const stored = await writeUploadFile(purpose, filename, optimized.buffer);
      relativePath = stored.relativePath;
      publicUrl = stored.publicUrl;
    } catch (error) {
      // Local/VPS should succeed; if disk is unavailable (e.g. misconfigured host),
      // fall back to MongoDB so admin product creation still works.
      logger.warn("Disk write failed — falling back to MongoDB binary storage", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const storeInMongo = !relativePath;

  const media = await mediaRepository.create({
    filename,
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
    purpose,
    ...(storeInMongo
      ? { data: optimized.buffer }
      : { path: relativePath, url: publicUrl }),
  });

  const id = media._id.toString();

  if (storeInMongo) {
    publicUrl = `/api/media/${id}`;
    await mediaRepository.updateUrl(id, publicUrl);
    logger.info("Image uploaded to MongoDB (serverless-safe)", {
      id,
      purpose,
      mimeType: optimized.mimeType,
      size: optimized.buffer.length,
    });
  } else {
    logger.info("Image uploaded to disk", {
      id,
      purpose,
      path: relativePath,
      mimeType: optimized.mimeType,
      size: optimized.buffer.length,
    });
  }

  if (!publicUrl) {
    throw new ValidationError("Could not store uploaded image");
  }

  return {
    id,
    url: publicUrl,
    filename,
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
    purpose,
  };
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value !== "string" &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number"
  );
}

/** Extract a file from multipart form data (field name defaults to `file`). */
export async function extractUploadFile(
  formData: FormData,
  fieldName = "file"
): Promise<File | Blob> {
  const file = formData.get(fieldName);
  if (!isUploadedFile(file) || file.size === 0) {
    throw new ValidationError("No file uploaded");
  }
  return file;
}
