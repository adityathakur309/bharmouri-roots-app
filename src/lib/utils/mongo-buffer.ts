/** Convert Mongoose/MongoDB binary fields to a Node Buffer (lean() can return { type: 'Buffer', data: [] }). */
export function toBuffer(value: unknown): Buffer | null {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);

  if (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type: string }).type === "Buffer" &&
    "data" in value &&
    Array.isArray((value as { data: number[] }).data)
  ) {
    return Buffer.from((value as { data: number[] }).data);
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_bsontype" in value &&
    (value as { _bsontype: string })._bsontype === "Binary" &&
    "buffer" in value
  ) {
    const bin = value as { buffer: Uint8Array };
    return Buffer.from(bin.buffer);
  }

  return null;
}
