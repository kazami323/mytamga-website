"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from "framer-motion";
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;
const ITEM_BASE_SIZE = 40;

/**
 * 'end' anchors the row to its bottom, so items grow upward — the classic
 * bottom dock. 'start' anchors it to the top and grows downward, which is what
 * a header needs: the panel stays put under the viewport edge.
 */
type DockAlign = "start" | "end";

type DockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  align?: DockAlign;
  label?: string;
};
type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  href?: string;
  label?: string;
};
type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
};
type DockIconProps = {
  className?: string;
  children: React.ReactNode;
};

type DocContextType = {
  mouseX: MotionValue;
  spring: SpringOptions;
  magnification: number;
  distance: number;
  align: DockAlign;
};
type DockProviderProps = {
  children: React.ReactNode;
  value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

function DockProvider({ children, value }: DockProviderProps) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error("useDock must be used within an DockProvider");
  }
  return context;
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  align = "end",
  label = "Application dock",
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();

  // Framer springs are driven in JS, so the global reduced-motion CSS rule does
  // not reach them. Pinning every item to its base size removes the magnifier
  // outright instead of merely speeding it up.
  const effectiveMagnification = shouldReduceMotion
    ? ITEM_BASE_SIZE
    : magnification;

  const maxHeight = useMemo(() => {
    if (shouldReduceMotion) {
      return panelHeight;
    }
    return Math.max(
      DOCK_HEIGHT,
      effectiveMagnification + effectiveMagnification / 2 + 4,
    );
  }, [effectiveMagnification, panelHeight, shouldReduceMotion]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={{
        height: height,
        scrollbarWidth: "none",
      }}
      className={cn(
        "mx-2 flex max-w-full overflow-x-auto",
        align === "start" ? "items-start" : "items-end",
      )}
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={cn("dock-panel mx-auto flex w-fit gap-4 px-4", className)}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label={label}
      >
        <DockProvider
          value={{
            mouseX,
            spring,
            distance,
            magnification: effectiveMagnification,
            align,
          }}
        >
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

function DockItem({ children, className, href, label }: DockItemProps) {
  // A callback ref keeps one measurement path for both the anchor and the div
  // branch without casting the ref object between element types.
  const ref = useRef<HTMLElement | null>(null);
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };

  const { distance, magnification, mouseX, spring } = useDock();

  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - domRect.x - domRect.width / 2;
  });

  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [ITEM_BASE_SIZE, magnification, ITEM_BASE_SIZE],
  );

  const width = useSpring(widthTransform, spring);

  const content = Children.map(children, (child) =>
    cloneElement(child as React.ReactElement<Record<string, unknown>>, {
      width,
      isHovered,
    }),
  );

  const shared = {
    style: { width },
    onHoverStart: () => isHovered.set(1),
    onHoverEnd: () => isHovered.set(0),
    onFocus: () => isHovered.set(1),
    onBlur: () => isHovered.set(0),
    className: cn(
      "relative inline-flex items-center justify-center",
      className,
    ),
  };

  // With an href this is a real link: focusable, keyboard-activatable and
  // announced as a link, rather than a div wearing role="button".
  if (href) {
    return (
      <motion.a ref={setRef} href={href} aria-label={label} {...shared}>
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div ref={setRef} tabIndex={0} role="button" {...shared}>
      {content}
    </motion.div>
  );
}

function DockLabel({ children, className, ...rest }: DockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps["isHovered"] as MotionValue<number> | undefined;
  const { align } = useDock();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      return;
    }
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });

    return () => unsubscribe();
  }, [isHovered]);

  const below = align === "start";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: below ? 10 : -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "dock-label absolute left-1/2 z-10 w-fit whitespace-pre rounded-md px-2 py-0.5 text-xs",
            below ? "top-full" : "-top-6",
            className,
          )}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, ...rest }: DockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const width = restProps["width"] as MotionValue<number> | undefined;
  // Standalone use outside a DockItem gets a static half-size icon instead of
  // throwing on an undefined motion value.
  const fallbackWidth = useMotionValue(ITEM_BASE_SIZE);

  const widthTransform = useTransform(width ?? fallbackWidth, (val) => val / 2);

  return (
    <motion.div
      style={{ width: widthTransform }}
      className={cn("flex items-center justify-center", className)}
    >
      {children}
    </motion.div>
  );
}

export { Dock, DockIcon, DockItem, DockLabel };
