"use client";

import { useEffect, useState } from "react";

export type ListViewMode = "card" | "list";

/** Card by default on narrow screens; list on desktop (overridable by toggle). */
export function useListViewMode(defaultDesktop: ListViewMode = "list") {
  const [viewMode, setViewMode] = useState<ListViewMode>("card");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setViewMode(mq.matches ? defaultDesktop : "card");
    apply();
    setReady(true);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [defaultDesktop]);

  return { viewMode, setViewMode, ready };
}
