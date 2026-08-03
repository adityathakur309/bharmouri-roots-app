import { mkdir, writeFile, unlink, access } from "fs/promises";
import path from "path";
import type { MediaPurpose } from "@/lib/db/models/media.model";

const PURPOSES = new Set<MediaPurpose>([
  "product",
  "category",
  "banner",
  "profile",
  "general",
]);

/** Absolute path to public/uploads on the server. */
export function getUploadsRoot(): string {
  return path.join(process.cwd(), "public", "uploads");
}

export function assertSafePurpose(purpose: string): MediaPurpose {
  if (!PURPOSES.has(purpose as MediaPurpose)) {
    throw new Error(`Invalid media purpose: ${purpose}`);
  }
  return purpose as MediaPurpose;
}

/**
 * Relative web path stored in MongoDB, e.g. uploads/product/uuid.webp
 * Public URL is `/${relativePath}`.
 */
export function buildRelativeStoragePath(
  purpose: MediaPurpose,
  filename: string
): string {
  const safeName = path.basename(filename);
  if (!safeName || safeName !== filename || safeName.includes("..")) {
    throw new Error("Invalid filename");
  }
  return path.posix.join("uploads", purpose, safeName);
}

export function toPublicUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `/${normalized}`;
}

export function resolveAbsolutePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized.startsWith("uploads/") ||
    normalized.includes("..") ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("Unsafe media path");
  }
  const absolute = path.resolve(process.cwd(), "public", ...normalized.split("/"));
  const root = path.resolve(getUploadsRoot());
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (absolute !== root && !absolute.startsWith(rootPrefix)) {
    throw new Error("Path escapes uploads directory");
  }
  return absolute;
}

export async function ensureUploadDir(purpose: MediaPurpose): Promise<string> {
  const dir = path.join(getUploadsRoot(), purpose);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function writeUploadFile(
  purpose: MediaPurpose,
  filename: string,
  buffer: Buffer
): Promise<{ relativePath: string; publicUrl: string; absolutePath: string }> {
  await ensureUploadDir(purpose);
  const relativePath = buildRelativeStoragePath(purpose, filename);
  const absolutePath = resolveAbsolutePath(relativePath);
  await writeFile(absolutePath, buffer);
  return {
    relativePath,
    publicUrl: toPublicUrl(relativePath),
    absolutePath,
  };
}

export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    await access(resolveAbsolutePath(relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function deleteUploadFile(relativePath: string): Promise<void> {
  try {
    await unlink(resolveAbsolutePath(relativePath));
  } catch {
    // File may already be gone — non-fatal
  }
}
