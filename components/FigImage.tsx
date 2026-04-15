"use client";

import React, { useEffect, useState } from "react";
import { API_BASE, apiHeaders } from "../lib/api";

/**
 * Displays a paper figure from the backend /api/figs endpoint.
 * Caches fetched images in a module-level Map so each figure is only fetched once.
 */
const cache = new Map<string, { data: string; mime: string }>();

interface FigImageProps {
  name: string; // e.g. "network.PNG"
  alt: string;
  caption?: string;
  className?: string;
  maxHeight?: string; // e.g. "400px"
}

export default function FigImage({
  name,
  alt,
  caption,
  className,
  maxHeight = "400px",
}: FigImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cache.has(name)) {
      const c = cache.get(name)!;
      setSrc(`data:${c.mime};base64,${c.data}`);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/api/figs/${encodeURIComponent(name)}`, { headers: apiHeaders })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        cache.set(name, { data: d.data, mime: d.mime });
        if (!cancelled) {
          setSrc(`data:${d.mime};base64,${d.data}`);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <figure className={`my-4 ${className || ""}`}>
      <div
        className="img-container flex items-center justify-center overflow-hidden"
        style={{ maxHeight, background: "var(--fig-bg)" }}
      >
        {loading ? (
          <div
            className="text-xs py-8"
            style={{ color: "var(--text-muted)" }}
          >
            Loading figure...
          </div>
        ) : src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-auto object-contain"
            style={{ maxHeight }}
          />
        ) : (
          <div
            className="text-xs py-8"
            style={{ color: "var(--text-muted)" }}
          >
            Figure not available
          </div>
        )}
      </div>
      {caption && (
        <figcaption
          className="text-xs mt-2 text-center italic"
          style={{ color: "var(--text-muted)" }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Returns the cached base64 data for a figure, or fetches it.
 * Used by the PPT export module.
 */
export async function getFigBase64(
  name: string
): Promise<{ data: string; mime: string } | null> {
  if (cache.has(name)) return cache.get(name)!;
  try {
    const r = await fetch(`${API_BASE}/api/figs/${encodeURIComponent(name)}`, { headers: apiHeaders });
    if (!r.ok) return null;
    const d = await r.json();
    cache.set(name, { data: d.data, mime: d.mime });
    return { data: d.data, mime: d.mime };
  } catch {
    return null;
  }
}
