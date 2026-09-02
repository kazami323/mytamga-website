"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const MAX_HEIGHT = 80;

/**
 * Explicit stops instead of the original's string sniffing over Tailwind class
 * names: that lookup tested for "purple" first, so the blue-to-purple bar was
 * handed a purple glow it never should have had.
 */
const BARS = [
  { from: "#a855f7", to: "#ec4899", glow: "#a855f7" },
  { from: "#3b82f6", to: "#a855f7", glow: "#3b82f6" },
  { from: "#22d3ee", to: "#3b82f6", glow: "#06b6d4" },
  { from: "#4ade80", to: "#22d3ee", glow: "#10b981" },
  { from: "#facc15", to: "#4ade80", glow: "#eab308" },
  { from: "#fb923c", to: "#facc15", glow: "#f97316" },
  { from: "#ef4444", to: "#fb923c", glow: "#ef4444" },
];

// A still ladder for reduced motion: the loader keeps its shape without any
// travel at all.
const STATIC_SCALE = [0.35, 0.6, 0.85, 1, 0.85, 0.6, 0.35];

interface LiquidLoadingProps {
  className?: string;
}

/**
 * Decorative by design — it carries no accessible name. The surface that shows
 * it owns the live region, so the two never announce twice.
 *
 * Frames are driven by rAF and written straight to the nodes. Reading the clock
 * during render, as the original did, both desynchronises hydration and forces
 * a re-render of every layer on every tick.
 */
export function LiquidLoading({ className }: LiquidLoadingProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dropRefs = useRef<(HTMLDivElement | null)[]>([]);
  const baseRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const paint = (time: number) => {
      BARS.forEach((_, index) => {
        const delay = index * 0.8;
        const primary = Math.sin(time + delay);
        const combined =
          primary +
          Math.sin(time * 4 + delay) * 0.15 +
          Math.sin(time * 8 + delay) * 0.05;

        const bar = barRefs.current[index];
        if (bar) {
          bar.style.height = `${Math.abs(MAX_HEIGHT * combined)}px`;
          bar.style.transform = combined < 0 ? "scaleY(-1)" : "scaleY(1)";
        }

        const drop = dropRefs.current[index];
        if (drop) {
          const isVisible = primary > 0.8;
          drop.style.opacity = isVisible ? "1" : "0";
          drop.style.transform = isVisible
            ? `translateY(${Math.sin(time * 8 + index * 0.5) * 3}px) scale(${
                0.8 + Math.sin(time * 6 + index * 0.3) * 0.4
              })`
            : "translateY(10px) scale(0.5)";
        }

        const base = baseRefs.current[index];
        if (base) {
          base.style.opacity = `${Math.sin(time * 3 + index * 0.9) * 0.4 + 0.6}`;
          base.style.transform = `scale(${
            0.6 + Math.sin(time * 2 + index * 0.6) * 0.4
          }) translateY(${Math.sin(time * 4 + index * 0.8)}px)`;
        }
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      BARS.forEach((_, index) => {
        const bar = barRefs.current[index];
        if (bar) {
          bar.style.height = `${MAX_HEIGHT * STATIC_SCALE[index]}px`;
        }
        const base = baseRefs.current[index];
        if (base) {
          base.style.opacity = "0.8";
        }
      });
      return;
    }

    const start = performance.now();
    let frame = requestAnimationFrame(function loop(now: number) {
      paint((now - start) / 1000);
      frame = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn("flex items-end gap-4 p-8", className)}
      aria-hidden="true"
    >
      {BARS.map((bar, index) => (
        <div key={bar.glow + index} className="relative flex flex-col items-center">
          <div
            ref={(node) => {
              dropRefs.current[index] = node;
            }}
            className="mb-3 h-4 w-4 rounded-full opacity-0 transition-opacity duration-500 ease-out"
            style={{
              background: `linear-gradient(90deg, ${bar.from}, ${bar.to})`,
              filter: "blur(0.5px)",
              boxShadow: `0 0 15px ${bar.glow}66`,
              transform: "translateY(10px) scale(0.5)",
            }}
          />

          <div
            ref={(node) => {
              barRefs.current[index] = node;
            }}
            className="relative w-10 overflow-hidden rounded-full"
            style={{
              height: 0,
              transformOrigin: "bottom",
              background: `linear-gradient(0deg, ${bar.from}, ${bar.to})`,
              filter: "blur(0.3px)",
              boxShadow: `0 0 20px ${bar.glow}80, inset 0 0 20px rgba(255,255,255,0.1)`,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-4 rounded-full bg-gradient-to-b from-white/40 to-transparent" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/30 via-white/10 to-transparent" />
          </div>

          <div
            ref={(node) => {
              baseRefs.current[index] = node;
            }}
            className="mt-2 h-3 w-3 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${bar.from}, ${bar.to})`,
              filter: "blur(0.2px)",
              boxShadow: `0 2px 8px ${bar.glow}66`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
