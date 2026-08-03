import { z } from "zod";

/** Shared pagination params for list APIs */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  [key: string]: unknown;
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

export function getSkip(page: number, limit: number): number {
  return (Math.max(page, 1) - 1) * limit;
}

/** Escape user input before using in RegExp (prevents ReDoS / injection). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Case-insensitive $or regex filter across string fields.
 * Returns empty object when search is blank.
 */
export function buildSearchFilter(
  search: string | undefined,
  fields: string[]
): Record<string, unknown> {
  const term = search?.trim();
  if (!term || fields.length === 0) return {};

  const safe = escapeRegex(term.slice(0, 100));
  const regex = new RegExp(safe, "i");
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

export type SortDirection = 1 | -1;

/**
 * Resolve a sort key to a Mongo sort document via an allowlist map.
 */
export function buildSort(
  sort: string | undefined,
  sortMap: Record<string, Record<string, SortDirection>>,
  defaultSort: Record<string, SortDirection> = { createdAt: -1 }
): Record<string, SortDirection> {
  if (!sort) return defaultSort;
  return sortMap[sort] ?? defaultSort;
}

/**
 * Parse URLSearchParams into a validated Zod schema.
 * Convenience wrapper used by list controllers.
 */
export function parseQuery<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  return schema.parse(Object.fromEntries(searchParams));
}

/** Merge equality filters, omitting undefined / empty values. */
export function buildEqualityFilter(
  entries: Record<string, unknown>
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null || value === "") continue;
    filter[key] = value;
  }
  return filter;
}
