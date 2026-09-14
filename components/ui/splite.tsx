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
}

export function SplineScene({
  scene,
  className,
  interactive = true,
  loadingLabel,
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
      robot.scale.x = 0.62;
      robot.scale.y = 0.62;
      robot.scale.z = 0.62;
      robot.position.y = 140;
    }
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
