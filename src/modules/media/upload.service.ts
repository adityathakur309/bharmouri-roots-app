import { randomUUID } from "crypto";
import { ValidationError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import type { MediaPurpose } from "@/lib/db/models/media.model";
import { writeUploadFile } from "@/lib/storage/local-media";
import { mediaRepository } from "./media.repository";

type SharpInstance = typeof import("sharp").default;

let sharpPromise: Promise<SharpInstance | null> | null = null;

/** Load sharp on demand so a missing native binary cannot crash the upload route. */
function loadSharp(): Promise<SharpInstance | null> {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((mod) => mod.default)
      .catch((error) => {
        logger.error("sharp failed to load — uploads will store the original file", {
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      });
  }
  return sharpPromise;
}

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

function originalImage(
  buffer: Buffer,
  detected: DetectedImage
): { buffer: Buffer; mimeType: string; extension: string } {
  return {
    buffer,
    mimeType: detected.mimeType,
    extension: detected.extension,
  };
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
    return originalImage(buffer, detected);
  }

  const sharp = await loadSharp();
  if (!sharp) {
    return originalImage(buffer, detected);
  }

  const createPipeline = () =>
    sharp(buffer, { failOn: "none", sequentialRead: true }).rotate();

  // Read metadata from a separate instance — reusing a pipeline after
  // metadata() can fail on some PNGs ("colourspace: parameter space not set").
  const meta = await createPipeline().metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  let pipeline = createPipeline();

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

function errorDetail(error: unknown) {
  return {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : undefined,
  };
}

async function createMongoBinary(
  purpose: UploadPurpose,
  filename: string,
  optimized: { buffer: Buffer; mimeType: string }
): Promise<{ id: string; url: string }> {
  const payload = Buffer.from(optimized.buffer);
  const media = await mediaRepository.create({
    filename,
    mimeType: optimized.mimeType,
    size: payload.length,
    purpose,
    data: payload,
  });
  const id = String(media._id);
  const url = `/api/media/${id}`;
  try {
    await mediaRepository.updateUrl(id, url);
  } catch (error) {
    logger.warn("Media URL update failed; serving /api/media/:id anyway", {
      id,
      ...errorDetail(error),
    });
  }
  logger.info("Image uploaded to MongoDB (serverless-safe)", {
    id,
    purpose,
    mimeType: optimized.mimeType,
    size: payload.length,
  });
  return { id, url };
}

async function createDiskRecord(
  purpose: UploadPurpose,
  filename: string,
  optimized: { buffer: Buffer; mimeType: string }
): Promise<{ id: string; url: string }> {
  const disk = await writeUploadFile(purpose, filename, optimized.buffer);
  const media = await mediaRepository.create({
    filename,
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
    purpose,
    path: disk.relativePath,
    url: disk.publicUrl,
  });
  const id = String(media._id);
  logger.info("Image uploaded to disk", {
    id,
    purpose,
    path: disk.relativePath,
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
  });
  return { id, url: disk.publicUrl };
}

async function persistUpload(
  purpose: UploadPurpose,
  filename: string,
  optimized: { buffer: Buffer; mimeType: string }
): Promise<{ id: string; url: string }> {
  const preferMongo = prefersMongoStorage();
  const attempts = preferMongo
    ? [createMongoBinary, createDiskRecord]
    : [createDiskRecord, createMongoBinary];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt(purpose, filename, optimized);
    } catch (error) {
      lastError = error;
      logger.warn("Upload storage attempt failed", {
        attempt: attempt.name,
        ...errorDetail(error),
      });
    }
  }

  logger.error("Could not persist uploaded image", errorDetail(lastError));
  throw new ValidationError("Could not store uploaded image");
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
    logger.warn("Image optimization failed — storing original file", {
      message: error instanceof Error ? error.message : String(error),
    });
    optimized = originalImage(raw, detected);
  }

  if (optimized.buffer.length > maxBytes) {
    throw new ValidationError("Optimized image exceeds size limit");
  }

  const filename = `${randomUUID()}.${optimized.extension}`;
  const stored = await persistUpload(purpose, filename, optimized);

  return {
    id: stored.id,
    url: stored.url,
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
