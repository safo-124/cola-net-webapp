"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

interface ImageCompareProps {
  leftSrc: string;
  rightSrc: string;
  leftLabel: string;
  rightLabel: string;
  leftBadge?: string;
  rightBadge?: string;
  leftBadgeColor?: string;
  rightBadgeColor?: string;
  height?: number;
}

export default function ImageCompare({
  leftSrc,
  rightSrc,
  leftLabel,
  rightLabel,
  leftBadge,
  rightBadge,
  leftBadgeColor = "var(--orange)",
  rightBadgeColor = "var(--accent)",
  height = 320,
}: ImageCompareProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePos = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      setPos((x / rect.width) * 100);
    },
    []
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => { e.preventDefault(); updatePos(e.clientX); };
    const onTouchMove = (e: TouchEvent) => updatePos(e.touches[0].clientX);
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, updatePos]);

  return (
    <div className="compare-slider-wrapper">
      {/* Labels above */}
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-xs font-semibold flex items-center gap-1.5">
          {leftLabel}
          {leftBadge && (
            <span className="compare-badge" style={{ background: leftBadgeColor + "22", color: leftBadgeColor }}>
              {leftBadge}
            </span>
          )}
        </span>
        <span className="text-xs font-semibold flex items-center gap-1.5">
          {rightBadge && (
            <span className="compare-badge" style={{ background: rightBadgeColor + "22", color: rightBadgeColor }}>
              {rightBadge}
            </span>
          )}
          {rightLabel}
        </span>
      </div>

      <div
        ref={containerRef}
        className="compare-slider"
        style={{ height }}
        onMouseDown={(e) => { setDragging(true); updatePos(e.clientX); }}
        onTouchStart={(e) => { setDragging(true); updatePos(e.touches[0].clientX); }}
      >
        {/* Right image (full) */}
        <img
          src={`data:image/png;base64,${rightSrc}`}
          alt={rightLabel}
          className="compare-img"
          draggable={false}
        />
        {/* Left image (clipped) */}
        <div className="compare-clip" style={{ width: `${pos}%` }}>
          <img
            src={`data:image/png;base64,${leftSrc}`}
            alt={leftLabel}
            className="compare-img"
            draggable={false}
          />
        </div>
        {/* Divider line + handle */}
        <div className="compare-divider" style={{ left: `${pos}%` }}>
          <div className="compare-line" />
          <div className="compare-handle">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M7 4L3 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 4L17 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
