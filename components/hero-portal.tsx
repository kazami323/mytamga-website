"use client";

import { useEffect, useState } from "react";

import GlyphPortal from "@/components/ui/glyph-portal";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { markSceneReady } from "@/lib/scene-ready";

const PORTAL_FONT = '"Unbounded Variable", "Arial Black", Arial, sans-serif';
const PORTAL_WEIGHT = 800;

// Поле, которое открывается внутри буквы: глубокий фиолетовый в акценте сайта.
// Одинаковое в обеих темах — внутри портала всегда тёмно и светлый текст.
const FIELD = (
  <>
    <div
      className="absolute inset-0"
      style={{
        transform: "scale(var(--gp-field-scale,1))",
        background:
          "radial-gradient(circle at 18% 8%, rgba(199,167,255,.55), transparent 34%), radial-gradient(circle at 82% 20%, rgba(241,239,233,.10), transparent 28%), radial-gradient(circle at 48% 78%, rgba(60,30,110,.6), transparent 44%), linear-gradient(135deg,#24144a 0%,#3d2775 48%,#150c2a 100%)",
      }}
    />
    {/* В тёмной теме слово в покое белое; с первым шагом камеры заливка
        уходит, и за буквами открывается фиолетовое поле. */}
    <div className="portal-word-tint absolute inset-0" />
  </>
);

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface HeroPortalProps {
  strings: Dictionary["hero"];
  steps: Dictionary["howItWorks"];
}

/**
 * Первый экран: слово MYTAMGA, прокрутка ведёт камеру внутрь буквы, и внутри
 * открывается объяснение — что это, для кого и как работает.
 *
 * Портал меряет буквы по шрифту в момент монтирования. Пока Unbounded не
 * загружен, он остаётся статичным (текст виден, но камера не летит), а когда
 * шрифт готов — монтируется заново с движением. Разметка с заголовком есть и
 * в серверном HTML, так что поисковик видит её сразу.
 */
export function HeroPortal({ strings, steps }: HeroPortalProps) {
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        setFontReady(true);
        // Первый экран собран — прелоадеру больше нечего ждать.
        markSceneReady();
      }
    };
    // Шрифт свой, с нашего же сервера, — обычно готов к концу прелоадера.
    const timeout = window.setTimeout(finish, 1600);
    document.fonts
      .load(`${PORTAL_WEIGHT} 100px "Unbounded Variable"`, "MYTAMGA")
      .then(finish, finish);
    return () => {
      settled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <div id="hero" className="hero-portal">
      <GlyphPortal
        key={fontReady ? "ready" : "pending"}
        word="MYTAMGA"
        fontFamily={PORTAL_FONT}
        fontWeight={PORTAL_WEIGHT}
        scrollLength={2.4}
        interactive
        enterLabel={strings.portalEnter}
        scrollHint={strings.portalHint}
        choiceLabel={strings.portalChoose}
        background={FIELD}
        style={{
          "--gp-paper": "var(--canvas)",
          "--gp-ink": "var(--ink)",
          "--gp-field": "#1a1030",
          "--gp-foreground": "#f1efe9",
        }}
        front={
          <>
            <p className="portal-eyebrow">{strings.kicker}</p>
            <p className="portal-support">{strings.title.join(" ")}</p>
            <span className="portal-scroll">{strings.portalHint} ↓</span>
          </>
        }
      >
        <div className="portal-copy">
          <h1 id="hero-title" className="portal-title">
            {strings.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="portal-lead">{strings.lead}</p>
          <div className="portal-actions" aria-label={strings.actions}>
            <LiquidMetalButton label={strings.contact} onClick={() => scrollToSection("contacts")} />
            <LiquidMetalButton label={strings.learnMore} onClick={() => scrollToSection("about")} />
          </div>

          <ol className="portal-steps" aria-label={steps.title}>
            {steps.steps.map((step, index) => (
              <li key={step.id} className="portal-step">
                <h2 className="portal-step-title">
                  <span className="portal-step-no">{String(index + 1).padStart(2, "0")}</span>
                  {step.title}
                </h2>
                <p className="portal-step-body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </GlyphPortal>
    </div>
  );
}
