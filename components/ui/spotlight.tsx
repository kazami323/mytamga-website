"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  motion,
  type SpringOptions,
  useSpring,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

type SpotlightProps = {
  className?: string;
  fill?: string;
  size?: number;
  springOptions?: SpringOptions;
};

export function Spotlight({
  className,
  fill = "white",
  size = 280,
  springOptions = { bounce: 0, duration: 0.35 },
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);

  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);
  const spotlightLeft = useTransform(mouseX, (x) => `${x - size / 2}px`);
  const spotlightTop = useTransform(mouseY, (y) => `${y - size / 2}px`);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;

    if (parent) {
      setParentElement(parent);
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!parentElement) return;

      const { left, top } = parentElement.getBoundingClientRect();
      mouseX.set(event.clientX - left);
      mouseY.set(event.clientY - top);
    },
    [mouseX, mouseY, parentElement],
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  useEffect(() => {
    if (!parentElement) return;

    parentElement.addEventListener("mousemove", handleMouseMove);
    parentElement.addEventListener("mouseenter", handleMouseEnter);
    parentElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parentElement.removeEventListener("mousemove", handleMouseMove);
      parentElement.removeEventListener("mouseenter", handleMouseEnter);
      parentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseEnter, handleMouseLeave, handleMouseMove, parentElement]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute z-[3] rounded-full blur-3xl transition-opacity duration-300",
        isHovered ? "opacity-20" : "opacity-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        left: spotlightLeft,
        top: spotlightTop,
        background: `radial-gradient(circle, ${fill} 0%, transparent 70%)`,
      }}
      aria-hidden="true"
    />
  );
}
