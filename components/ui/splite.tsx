"use client";

import type { Application } from "@splinetool/runtime";
import { lazy, Suspense } from "react";

import { SceneBoundary } from "@/components/ui/scene-boundary";
import { markSceneReady } from "@/lib/scene-ready";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
  interactive?: boolean;
}

export function SplineScene({
  scene,
  className,
  interactive = true,
}: SplineSceneProps) {
  const handleLoad = (application: Application) => {
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
    <div className={className}>
      {/* A dead CDN must cost the robot, not the page. Reporting the scene as
          ready releases the preloader instead of stranding it. */}
      <SceneBoundary onError={markSceneReady}>
        <Suspense
          fallback={
            <div
              className="flex h-full w-full items-center justify-center"
              role="status"
              aria-label="Место под текст"
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
