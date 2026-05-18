/** True when id is a 24-char hex MongoDB ObjectId (required for cart/order APIs). */
export function isValidMongoId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}
