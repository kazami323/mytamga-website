"use client";

import type { Application } from "@splinetool/runtime";
import { lazy, Suspense, useEffect, useRef } from "react";

import { SceneBoundary } from "@/components/ui/scene-boundary";
import { markSceneReady } from "@/lib/scene-ready";
import { releaseWebGL } from "@/lib/webgl";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
  interactive?: boolean;
  loadingLabel: string;
  /** Где стоит робот внутри сцены: масштаб и подъём от исходной точки. */
  bot?: { scale: number; y: number };
  /** Сцена загружена — её можно ставить на паузу и подстраивать. */
  onApplication?: (application: Application) => void;
}

export function SplineScene({
  scene,
  className,
  interactive = true,
  loadingLabel,
  bot = { scale: 0.62, y: 140 },
  onApplication,
}: SplineSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Caught at load: by the time this unmounts, react-spline may already have
  // taken its canvas out of the DOM, leaving nothing to find.
  const canvases = useRef<HTMLCanvasElement[]>([]);

  useEffect(() => () => releaseWebGL(canvases.current), []);

  const handleLoad = (application: Application) => {
    canvases.current = [...(hostRef.current?.querySelectorAll("canvas") ?? [])];
    markSceneReady();

    const robot = application.findObjectByName("Bot");

    if (robot) {
      robot.scale.x = bot.scale;
      robot.scale.y = bot.scale;
      robot.scale.z = bot.scale;
      robot.position.y = bot.y;
    }

    onApplication?.(application);
  };

  return (
    <div ref={hostRef} className={className}>
      {/* A dead CDN must cost the robot, not the page. Reporting the scene as
          ready releases the preloader instead of stranding it. */}
      <SceneBoundary onError={markSceneReady}>
        <Suspense
          fallback={
            <div
              className="flex h-full w-full items-center justify-center"
              role="status"
              aria-label={loadingLabel}
            >
              <span className="spline-loader" aria-hidden="true" />
            </div>
          }
        >
          <Spline
            scene={scene}
            className="h-full w-full"
            onLoad={handleLoad}
            style={{ pointerEvents: interactive ? "auto" : "none" }}
          />
        </Suspense>
      </SceneBoundary>
    </div>
  );
}
