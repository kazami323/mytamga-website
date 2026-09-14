"use client";

import type { ShaderMount as ShaderMountInstance } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { releaseWebGL } from "@/lib/webgl";

interface LiquidMetalButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  // Required: a default here would be one language's text leaking into every
  // other locale's page the moment a caller forgot to pass one.
  label: string;
  viewMode?: "text" | "icon";
}

type Ripple = {
  id: number;
  x: number;
  y: number;
};

export function LiquidMetalButton({
  className,
  disabled,
  label,
  onBlur,
  onClick,
  onFocus,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onMouseUp,
  type = "button",
  viewMode = "text",
  ...props
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<ShaderMountInstance | null>(null);
  const rippleId = useRef(0);
  const timers = useRef<number[]>([]);

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      return { height: 50, width: 50 };
    }

    const labelWidth = Array.from(label).length * 8.4 + 48;

    return {
      height: 50,
      width: Math.min(232, Math.max(174, Math.ceil(labelWidth))),
    };
  }, [label, viewMode]);

  useEffect(() => {
    let isActive = true;
    const activeTimers = timers.current;
    const host = shaderRef.current;

    const loadShader = async () => {
      const { liquidMetalFragmentShader, ShaderMount } = await import(
        "@paper-design/shaders"
      );

      if (!isActive || !shaderRef.current) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

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
        reduceMotion ? 0 : 0.55,
      );
    };

    void loadShader().catch(() => {
      shaderMount.current = null;
    });

    return () => {
      isActive = false;
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      // Before dispose(), which removes the canvas: release its context too.
      releaseWebGL(host?.querySelectorAll("canvas") ?? []);
      shaderMount.current?.dispose();
      shaderMount.current = null;
    };
  }, []);

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isHighlighted = (isHovered || isFocused) && !disabled;

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);

    if (!prefersReducedMotion()) {
      shaderMount.current?.setSpeed(1);
    }

    onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    setIsPressed(false);

    if (!prefersReducedMotion()) {
      shaderMount.current?.setSpeed(0.55);
    }

    onMouseLeave?.(event);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!prefersReducedMotion()) {
      shaderMount.current?.setSpeed(2.2);

      const speedTimer = window.setTimeout(() => {
        shaderMount.current?.setSpeed(isHovered ? 1 : 0.55);
      }, 280);
      timers.current.push(speedTimer);

      const rect = event.currentTarget.getBoundingClientRect();
      const ripple = {
        id: rippleId.current++,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      setRipples((current) => [...current, ripple]);
      const rippleTimer = window.setTimeout(() => {
        setRipples((current) =>
          current.filter((item) => item.id !== ripple.id),
        );
      }, 600);
      timers.current.push(rippleTimer);
    }

    onClick?.(event);
  };

  return (
    <span
      className={cn(
        "relative isolate inline-block shrink-0 rounded-full transition-[transform,filter] duration-300",
        isPressed && "scale-[0.975]",
        isHighlighted &&
          "drop-shadow-[0_0_18px_rgba(199,167,255,0.18)]",
      )}
      style={{ height: dimensions.height, width: dimensions.width }}
    >
      <span
        ref={shaderRef}
        className="liquid-metal-shader absolute inset-0 overflow-hidden rounded-full bg-[linear-gradient(110deg,#656565_0%,#f5f3ee_28%,#454646_51%,#d6d3ca_72%,#6d6e6e_100%)] transition-[filter] duration-500"
        style={{
          filter: isHighlighted
            ? "hue-rotate(58deg) saturate(1.8) brightness(1.18)"
            : "hue-rotate(0deg) saturate(1) brightness(1)",
        }}
        aria-hidden="true"
      />
      <span
        className={cn(
          "pointer-events-none absolute inset-[2px] z-10 rounded-full bg-[linear-gradient(180deg,#242525_0%,#080909_58%,#020303_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-[box-shadow,background] duration-300",
          isHighlighted &&
            "bg-[linear-gradient(145deg,#46315f_0%,#251936_48%,#0c0911_100%)] shadow-[inset_0_1px_0_rgba(231,217,255,0.3),inset_0_-8px_24px_rgba(104,68,158,0.22)]",
        )}
        aria-hidden="true"
      />
      <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2 px-5 text-sm font-semibold tracking-[-0.01em] text-[#f3f1eb] [text-shadow:0_1px_3px_rgba(0,0,0,0.75)]">
        {viewMode === "icon" ? (
          <Sparkles aria-hidden="true" size={17} />
        ) : (
          label
        )}
      </span>
      <button
        {...props}
        type={type}
        disabled={disabled}
        className={cn(
          "liquid-metal-trigger absolute inset-0 z-30 cursor-pointer overflow-hidden rounded-full border-0 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        aria-label={label}
        onBlur={(event) => {
          setIsPressed(false);
          setIsFocused(false);
          shaderMount.current?.setSpeed(
            prefersReducedMotion() ? 0 : isHovered ? 1 : 0.55,
          );
          onBlur?.(event);
        }}
        onClick={handleClick}
        onMouseDown={(event) => {
          setIsPressed(true);
          onMouseDown?.(event);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={(event) => {
          setIsFocused(true);

          if (!prefersReducedMotion()) {
            shaderMount.current?.setSpeed(1);
          }

          onFocus?.(event);
        }}
        onMouseUp={(event) => {
          setIsPressed(false);
          onMouseUp?.(event);
        }}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="liquid-metal-ripple pointer-events-none absolute size-5 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_70%)]"
            style={{ left: ripple.x, top: ripple.y }}
            aria-hidden="true"
          />
        ))}
      </button>
    </span>
  );
}
