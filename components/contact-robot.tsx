"use client";

import type { Application } from "@splinetool/runtime";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { SplineScene } from "@/components/ui/splite";

const SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";
// Выше 1.5 разница на маленькой сцене не видна, а память растёт квадратом:
// на телефоне с dpr 3 это в четыре раза меньше пикселей.
const MAX_PIXEL_RATIO = 1.5;

type Mode = "pending" | "scene" | "poster";

// Проверка создаёт WebGL-контекст — делаем её один раз на документ.
let affordable: boolean | undefined;
const noSubscribe = () => () => {};
const clientMode = (): Mode => {
  affordable ??= canAffordScene();
  return affordable ? "scene" : "poster";
};
// На сервере устройство неизвестно: ни сцены, ни картинки — только место под них.
const serverMode = (): Mode => "pending";

/**
 * Живая сцена весит десятки мегабайт видеопамяти, поэтому она только там, где
 * это окупается: мышь (робот следит за курсором — на тач-экране смотреть не
 * за чем), не урезанный трафик, не слабое железо, не «меньше движения».
 * Остальным — картинка того же робота.
 */
function canAffordScene() {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return false;
  if ((nav.deviceMemory ?? 8) < 4) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return false;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return false;
  }
  return true;
}

/** Ограничить плотность пикселей: у Application нет для этого публичного метода. */
function capPixelRatio(application: Application) {
  const renderer = (application as unknown as {
    _renderer?: { setPixelRatio?: (ratio: number) => void };
  })._renderer;
  if (window.devicePixelRatio > MAX_PIXEL_RATIO) {
    renderer?.setPixelRatio?.(MAX_PIXEL_RATIO);
    application.requestRender();
  }
}

interface ContactRobotProps {
  loadingLabel: string;
  logoAlt: string;
}

/**
 * Робот у формы заявки. Сцена грузится, только когда раздел подъезжает к
 * экрану, и замирает, как только уходит из него: вне экрана она не тратит ни
 * кадра. На груди — наш знак: торс в сцене неподвижен, двигаются голова и руки,
 * поэтому знак лежит поверх холста, а не внутри сцены.
 */
export function ContactRobot({ loadingLabel, logoAlt }: ContactRobotProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const visibleRef = useRef(false);
  const mode = useSyncExternalStore(noSubscribe, clientMode, serverMode);
  const [isNear, setIsNear] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Два наблюдателя: дальний решает, когда начинать загрузку, ближний — когда
  // крутить кадры.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || mode !== "scene") return;

    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          near.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    const visible = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      const app = appRef.current;
      if (!app) return;
      if (entry.isIntersecting) app.play();
      else app.stop();
    });

    near.observe(host);
    visible.observe(host);
    return () => {
      near.disconnect();
      visible.disconnect();
    };
  }, [mode]);

  const handleApplication = (application: Application) => {
    appRef.current = application;
    capPixelRatio(application);
    if (!visibleRef.current) application.stop();
    setIsLoaded(true);
  };

  return (
    <div
      ref={hostRef}
      className="contact-robot"
      data-mode={mode}
      data-loaded={isLoaded || mode === "poster" ? "true" : "false"}
    >
      <div className="contact-robot-glow" aria-hidden="true" />

      {mode === "poster" && (
        <Image
          src="/brand/robot-poster.png"
          alt=""
          width={640}
          height={640}
          sizes="(min-width: 1024px) 26rem, 80vw"
          className="contact-robot-stage"
        />
      )}

      {mode === "scene" && isNear && (
        <SplineScene
          scene={SCENE}
          className="contact-robot-stage"
          loadingLabel={loadingLabel}
          bot={{ scale: 0.86, y: 30 }}
          onApplication={handleApplication}
        />
      )}

      <Image
        src="/brand/tamga-symbol.png"
        alt={logoAlt}
        width={219}
        height={192}
        className="contact-robot-logo"
      />
    </div>
  );
}
