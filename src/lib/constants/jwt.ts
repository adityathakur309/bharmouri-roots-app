/** Access-token lifetime and algorithm (shared by Node + Edge JWT helpers). */
export const JWT_EXPIRES_IN = "7d" as const;
export const JWT_ALGORITHM = "HS256" as const;
export const JWT_EXPIRES_SECONDS = 7 * 24 * 60 * 60;

/** Short-lived signed link for email → complete registration */
export const REGISTRATION_TOKEN_PURPOSE = "register" as const;
export const REGISTRATION_TOKEN_EXPIRES_IN = "1h" as const;
export const REGISTRATION_TOKEN_EXPIRES_MINUTES = 60;

/** Short-lived challenge after password match when MFA is enabled */
export const MFA_CHALLENGE_PURPOSE = "login_mfa" as const;
export const MFA_CHALLENGE_EXPIRES_IN = "10m" as const;
