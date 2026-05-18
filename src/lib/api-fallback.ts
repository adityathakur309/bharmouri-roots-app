/** Use API list when non-empty; otherwise show demo data for client showcase. */
export function withFallbackArray<T>(apiData: T[] | null | undefined, fallback: T[]): T[] {
  if (apiData && apiData.length > 0) return apiData;
  return fallback;
}

export function withFallbackItem<T>(apiData: T | null | undefined, fallback: T): T {
  if (apiData != null && (typeof apiData !== "object" || Object.keys(apiData as object).length > 0)) {
    return apiData;
  }
  return fallback;
}
