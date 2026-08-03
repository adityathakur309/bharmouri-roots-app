import { z } from "zod";
import { paginationSchema } from "@/lib/utils/query";

export const userListQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "oldest", "name_asc", "name_desc"]).optional(),
});

export type UserListQueryInput = z.infer<typeof userListQuerySchema>;

export const updateUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.boolean().optional(),
});
