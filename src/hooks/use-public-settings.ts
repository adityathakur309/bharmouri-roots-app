"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/services/api";
import {
  DEFAULT_BUSINESS_SETTINGS,
  type PublicBusinessSettings,
} from "@/types/settings";

/** Shared public business settings for contact/footer (one fetch, cached in state). */
let cache: PublicBusinessSettings | null = null;
let inflight: Promise<PublicBusinessSettings> | null = null;

async function loadSettings(): Promise<PublicBusinessSettings> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = settingsApi
    .getPublic()
    .then((res) => {
      cache = res.data ?? { ...DEFAULT_BUSINESS_SETTINGS };
      return cache;
    })
    .catch(() => {
      cache = { ...DEFAULT_BUSINESS_SETTINGS };
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicBusinessSettings>(
    cache ?? DEFAULT_BUSINESS_SETTINGS
  );
  const [loaded, setLoaded] = useState(Boolean(cache));

  useEffect(() => {
    let cancelled = false;
    loadSettings().then((s) => {
      if (!cancelled) {
        setSettings(s);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loaded };
}
