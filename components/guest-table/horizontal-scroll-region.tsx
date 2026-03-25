"use client";

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

type HorizontalScrollRegionProps = {
  children: ReactNode;
  /** Bump when table width may change (columns, data, loading). */
  measureKey?: string | number;
  className?: string;
  /** Renders below the horizontal track (e.g. add guest); wrapped with sticky footer. */
  footer?: ReactNode;
};

/**
 * Hides the main horizontal scrollbar and shows a custom track + thumb at the
 * bottom of the table (above the add-guest row) so scrolling is always visible.
 */
export function HorizontalScrollRegion({
  children,
  measureKey,
  className,
  footer,
}: HorizontalScrollRegionProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startScrollLeft: number;
    maxScroll: number;
    trackWidth: number;
    thumbFraction: number;
  } | null>(null);

  const [scroll, setScroll] = useState({
    left: 0,
    scrollWidth: 0,
    clientWidth: 0,
  });

  const refresh = useCallback(() => {
    const v = viewportRef.current;
    if (!v) return;
    setScroll({
      left: v.scrollLeft,
      scrollWidth: v.scrollWidth,
      clientWidth: v.clientWidth,
    });
  }, []);

  useLayoutEffect(() => {
    refresh();
  }, [measureKey, refresh]);

  useEffect(() => {
    const v = viewportRef.current;
    if (!v) return;

    const onScroll = () => refresh();
    v.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(refresh);
    });
    ro.observe(v);
    const table = v.querySelector("table");
    if (table) ro.observe(table);

    refresh();
    return () => {
      v.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [refresh]);

  const maxScroll = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
  const needsScroll = scroll.scrollWidth > scroll.clientWidth + 1;
  const thumbFraction =
    scroll.scrollWidth > 0 ? scroll.clientWidth / scroll.scrollWidth : 1;
  const thumbPosRatio = maxScroll > 0 ? scroll.left / maxScroll : 0;

  const applyScrollLeft = useCallback((next: number) => {
    const v = viewportRef.current;
    if (!v) return;
    const ms = Math.max(0, v.scrollWidth - v.clientWidth);
    v.scrollLeft = Math.max(0, Math.min(ms, next));
    refresh();
  }, [refresh]);

  const onTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!needsScroll || e.button !== 0) return;
    const track = trackRef.current;
    const v = viewportRef.current;
    if (!track || !v) return;

    const rect = track.getBoundingClientRect();
    const trackW = rect.width;
    const tf = v.clientWidth / v.scrollWidth;
    const thumbW = trackW * tf;
    const maxThumbLeft = Math.max(0, trackW - thumbW);
    const tLeft = thumbPosRatio * maxThumbLeft;
    const x = e.clientX - rect.left;

    const ms = Math.max(0, v.scrollWidth - v.clientWidth);

    if (x >= tLeft && x <= tLeft + thumbW) {
      dragRef.current = {
        startX: e.clientX,
        startScrollLeft: v.scrollLeft,
        maxScroll: ms,
        trackWidth: trackW,
        thumbFraction: tf,
      };
      track.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    const targetCenter = x - thumbW / 2;
    const ratio = maxThumbLeft > 0 ? targetCenter / maxThumbLeft : 0;
    applyScrollLeft(ratio * ms);
  };

  const onTrackPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const v = viewportRef.current;
    if (!drag || !v) return;

    const maxThumbLeft = Math.max(
      0,
      drag.trackWidth - drag.trackWidth * drag.thumbFraction
    );
    const deltaPx = e.clientX - drag.startX;
    const deltaScroll =
      maxThumbLeft > 0 ? (deltaPx / maxThumbLeft) * drag.maxScroll : 0;
    v.scrollLeft = drag.startScrollLeft + deltaScroll;
    refresh();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
  };

  return (
    <div className={cn("flex min-h-0 min-w-0 w-full flex-1 flex-col", className)}>
      <div
        ref={viewportRef}
        onScroll={refresh}
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-visible",
          "[scrollbar-width:none] [-ms-overflow-style:none]",
          "[&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:bg-transparent"
        )}
      >
        {children}
      </div>

      {(needsScroll || footer) && (
        <div
          className={cn(
            "sticky bottom-0 z-20 mt-auto w-full shrink-0 rounded-b-lg border-t border-border bg-white",
            "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.07),0_-2px_4px_-2px_rgba(0,0,0,0.05)]"
          )}
        >
          {needsScroll && (
            <div
              className="border-b border-border/70 bg-muted/30 px-3 pt-2.5 pb-2.5"
              aria-hidden
            >
              <div
                ref={trackRef}
                role="presentation"
                className="relative h-3.5 w-full cursor-grab touch-none rounded-full bg-muted active:cursor-grabbing"
                onPointerDown={onTrackPointerDown}
                onPointerMove={onTrackPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <div
                  className="pointer-events-none absolute top-0 h-3.5 rounded-full bg-primary shadow-sm ring-1 ring-primary/30"
                  style={{
                    width: `${thumbFraction * 100}%`,
                    left: `${thumbPosRatio * (1 - thumbFraction) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
          {footer}
        </div>
      )}
    </div>
  );
}
