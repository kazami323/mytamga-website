"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * One client boundary for the whole page's reveal, so sections themselves
 * stay server components. Reduced motion keeps the fade and drops the travel —
 * in CSS (.motion-reveal), so the server and client render the same first frame.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={cn("motion-reveal", className)}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
