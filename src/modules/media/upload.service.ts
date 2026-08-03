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

async function readToBuffer(input: File | Buffer | ArrayBuffer): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof ArrayBuffer) return Buffer.from(input);
  return Buffer.from(await input.arrayBuffer());
}

function claimedMime(file: File | undefined, detected: DetectedImage): void {
  if (!file?.type) return;
  const normalized = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!ALLOWED_MIME.has(normalized)) {
    throw new ValidationError("Only JPEG, PNG, WebP, and GIF images are allowed");
  }
  // Declared MIME must match magic bytes (prevents polyglot uploads)
  if (normalized !== detected.mimeType) {
    throw new ValidationError("File content does not match declared MIME type");
  }
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

  let pipeline = sharp(buffer, { failOn: "none" }).rotate();

  const meta = await pipeline.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (
    width > options.maxWidth ||
    height > options.maxHeight
  ) {
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

/**
 * Disk-backed image upload pipeline (production-friendly for VPS/local):
 * validate → optimize in memory → write to public/uploads → store path/url in MongoDB.
 *
 * Returns a static URL (/uploads/...) so Next.js can serve files directly (fast).
 */
export async function uploadImage(
  input: File | Buffer | ArrayBuffer,
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

  if (input instanceof File) {
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

  let stored: { relativePath: string; publicUrl: string };
  try {
    stored = await writeUploadFile(purpose, filename, optimized.buffer);
  } catch (error) {
    logger.error("Failed to write upload to disk", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new ValidationError("Could not store uploaded image");
  }

  const media = await mediaRepository.create({
    filename,
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
    path: stored.relativePath,
    url: stored.publicUrl,
    purpose,
  });

  const id = media._id.toString();
  logger.info("Image uploaded to disk", {
    id,
    purpose,
    path: stored.relativePath,
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
  });

  return {
    id,
    url: stored.publicUrl,
    filename,
    mimeType: optimized.mimeType,
    size: optimized.buffer.length,
    purpose,
  };
}

/** Extract a File from multipart form data (field name defaults to `file`). */
export async function extractUploadFile(
  formData: FormData,
  fieldName = "file"
): Promise<File> {
  const file = formData.get(fieldName);
  if (!file || !(file instanceof File)) {
    throw new ValidationError("No file uploaded");
  }
  return file;
}
