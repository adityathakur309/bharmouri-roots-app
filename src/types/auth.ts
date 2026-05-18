export type UserRole = "user" | "admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
}
