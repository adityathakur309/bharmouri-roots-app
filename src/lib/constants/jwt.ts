/** Access-token lifetime and algorithm (shared by Node + Edge JWT helpers). */
export const JWT_EXPIRES_IN = "7d" as const;
export const JWT_ALGORITHM = "HS256" as const;
export const JWT_EXPIRES_SECONDS = 7 * 24 * 60 * 60;
