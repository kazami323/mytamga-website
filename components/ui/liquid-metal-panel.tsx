"use client";

import type { ShaderMount as ShaderMountInstance } from "@paper-design/shaders";
import type React from "react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface LiquidMetalPanelProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The same rim treatment as LiquidMetalButton, sized for arbitrary surfaces:
 * a shader canvas underneath, an inset dark face covering all but its edge.
 *
 * A card canvas is an order of magnitude more pixels than a pill button, so the
 * shader mounts only once the panel is near the viewport and stays frozen until
 * the pointer arrives.
 */
export function LiquidMetalPanel({
  children,
  className,
  innerClassName,
}: LiquidMetalPanelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<ShaderMountInstance | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    let isDisposed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        observer.disconnect();

        void (async () => {
          const { liquidMetalFragmentShader, ShaderMount } = await import(
            "@paper-design/shaders"
          );

          if (isDisposed || !shaderRef.current || shaderMount.current) {
            return;
          }

          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            {
              u_angle: 45,
              u_contour: 0,
              u_distortion: 0,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
              u_repetition: 4,
              u_scale: 8,
              u_shape: 1,
              u_shiftBlue: 0.3,
              u_shiftRed: 0.3,
              u_softness: 0.5,
            },
            undefined,
            0,
          );
        })().catch(() => {
          shaderMount.current = null;
        });
      },
      { rootMargin: "300px" },
    );

    observer.observe(host);

    return () => {
      isDisposed = true;
      observer.disconnect();
      shaderMount.current?.dispose();
      shaderMount.current = null;
    };
  }, []);

  const setSpeed = (speed: number) => {
    if (prefersReducedMotion()) {
      return;
    }
    shaderMount.current?.setSpeed(speed);
  };

  const activate = () => {
    setIsActive(true);
    setSpeed(1);
  };

  const deactivate = () => {
    setIsActive(false);
    setSpeed(0);
  };

  return (
    <div
      ref={hostRef}
      className={cn("relative isolate rounded-[1.35rem]", className)}
      onMouseEnter={activate}
      onMouseLeave={deactivate}
      onFocus={activate}
      onBlur={deactivate}
    >
      <span
        ref={shaderRef}
        className="liquid-metal-shader absolute inset-0 overflow-hidden rounded-[inherit] bg-[linear-gradient(110deg,#656565_0%,#f5f3ee_28%,#454646_51%,#d6d3ca_72%,#6d6e6e_100%)] transition-[filter] duration-500"
        style={{
          filter: isActive
            ? "hue-rotate(58deg) saturate(1.8) brightness(1.18)"
            : "hue-rotate(0deg) saturate(1) brightness(1)",
        }}
        aria-hidden="true"
      />
      <span
        className="liquid-metal-face pointer-events-none absolute inset-[1.5px] z-10 rounded-[inherit] transition-[box-shadow,background-image] duration-300"
        data-active={isActive}
        aria-hidden="true"
      />
      <div className={cn("relative z-20", innerClassName)}>{children}</div>
    </div>
  );
}
