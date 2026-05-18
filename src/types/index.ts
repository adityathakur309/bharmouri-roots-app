export * from "./auth";
export * from "./order";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}
