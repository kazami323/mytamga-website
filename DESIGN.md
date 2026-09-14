# MyTamga website — design context

## Product context

- Subject: a technology company presented through an interactive 3D hero.
- Audience: prospective customers and partners.
- Page job: create a confident first impression while the final content is being prepared.
- Current copy policy: the approved hero statement, supporting copy, and CTA labels are live; the utility kicker remains `Место под текст` until its final wording arrives.

## Visual direction

The interface uses a quiet, near-black exhibition space around one interactive 3D object. The signature is the contrast between the oversized wide display type and the off-axis orbital line behind the scene. Decorative effects stay subordinate to the Spline object.

## Runtime tokens

The canonical runtime values live in `app/globals.css` under `:root` and are exposed to Tailwind through `@theme inline`.

| Role | Token | Value |
| --- | --- | --- |
| Canvas | `--canvas` | `#050606` |
| Surface | `--surface` | `#0b0d0d` |
| Raised surface | `--surface-raised` | `#111414` |
| Primary ink | `--ink` | `#f1efe9` |
| Muted ink | `--ink-muted` | `#a7aaa4` |
| Divider | `--line` | `#2a2e2d` |
| Interactive light | `--accent` | `#c7a7ff` |
| Horizontal inset | `--gutter` | `2rem` → `3rem` → `4.5rem` → `6.75rem` |

`--gutter` is the single horizontal inset shared by the header and the hero copy. Both read the token rather than repeating `px-*` utilities, so the wordmark and the headline cannot drift apart.

## Typography

- Display: Unbounded Variable, used only for the hero statement.
- Body: Manrope Variable, used for supporting and utility text.
- Hero text is intentionally tight and large; paragraphs remain capped at a readable measure.

## Header

- A fixed, transparent bar over the hero, laid out on three tracks with equal flanks: the wordmark holds the left gutter and the five links are centred on the viewport itself, not on the space beside the wordmark.
- Links stay in muted ink and reveal an accent underline on hover and keyboard focus; the accent never appears at rest, so navigation does not compete with the hero statement.
- Below `md` the links collapse into a toggle. The panel it opens is opaque rather than translucent, because it lands directly on the headline. Escape closes it and returns focus to the toggle.
- The wordmark is set in the body face. Unbounded stays reserved for the hero statement.

## Preloader

- A full-bleed overlay on the canvas: the liquid loader over the wordmark, which is the placeholder for the logo once it exists.
- It waits on the Spline scene, the one genuinely slow asset, not on a fixed timer. A 700ms floor keeps it from flashing on a warm cache; a 7s ceiling means a dead CDN cannot hold the page hostage.
- Scroll is locked while it is up and restored when it leaves.
- The loader keeps the source component's rainbow, which is deliberate and the only place on the site where the single-accent rule is set aside.
- Frames are driven by rAF straight into the nodes. State-per-frame would re-render every layer thirty times a second and compete for the main thread with the very scene the overlay is waiting for.

## Capabilities section

- The first section below the hero. It breaks out the four things the hero's supporting copy already promises, so the second screen delivers what the first one claims.
- Four cards in one row on wide screens, two up on tablets, stacked on phones; all cards share a height so the row reads as one band.
- Each card wears the liquid-metal rim from the primary buttons through `LiquidMetalPanel`: a shader canvas underneath and an inset face covering all but its edge. Hover shifts the rim toward violet chrome and warms the face, matching the buttons exactly.
- A card canvas is an order of magnitude more pixels than a pill button, so the shader mounts only once the panel is near the viewport and stays frozen at speed 0 until the pointer arrives.
- The heading is set in the body face. Unbounded stays reserved for the hero statement.

## Themes

- Dark is the default and the absence of `data-theme` on `<html>`. Light is
  `:root[data-theme="light"]` — "gallery white", warm paper, the same
  exhibition concept in daylight.
- A synchronous script in `<head>` sets the attribute from `localStorage`
  before first paint, so a returning light visitor never sees dark first.
  The page stays statically prerendered; a cookie read on the server would
  have given that up.
- `lib/theme.ts` owns the mechanism: `useIsLightTheme` reads the attribute
  through `useSyncExternalStore` and never mirrors it in state, and re-applies
  the stored value in a layout effect because Strict Mode's dev remount
  resets `<html>` attributes.
- The switch is `CinematicThemeSwitcher`: a sprung pill thumb with a light
  burst on toggle, sized to the header's 40px controls. Everything that
  depends on the theme — colours, shadows, the thumb's position, which icon
  shows — lives in CSS keyed on `[data-theme]`, so it is drawn in its final
  position on first paint. React only handles the click and `aria-checked`.
  The spring is an overshooting CSS curve; reduced motion drops it and the
  burst.
- Every colour that differs between themes is a token. Neutral tints use the
  `--fg-rgb` helper, `rgb(var(--fg-rgb) / a)`, which resolves to the exact
  white alpha in dark and to ink alphas in light.
- The robot, the liquid-metal buttons and the preloader rainbow are the same
  in both themes. Cards keep their shader rim and swap only the face.
- Light text tokens clear 4.5:1 on canvas and surface — the faintest is
  4.64:1 — and keep the dark theme's order of prominence: ink, muted, soft,
  faint.

## Sections

- The page is one document: hero, capabilities, how it works, calculation,
  about, contacts, footer. Navigation is anchors, not routes.
- Every section reads its copy from `lib/content.ts`. Nothing is written
  inline, so replacing the placeholders with the client's wording is one edit
  in one file. `TODO(copy)` marks a placeholder, `REVIEW(copy)` marks an
  industry fact the client still has to confirm.
- Sections share `SectionHeading` and the `--gutter` inset, so their left edges
  line up with the hero copy at every width.
- `Reveal` is the single client boundary for entrance animation; the sections
  themselves stay server components.
- The lead form posts to a Server Action and reports honestly that intake is
  not connected. It never fakes a success.

## Motion

- Scrolling the hero separates the planes: the copy is the near plane and travels furthest, the scene lags behind it. Transforms only, so the waist crop and the wordmark alignment are untouched — at rest the composition is still pixel-exact.
- Capability cards rise and fade in once, staggered by 80ms.
- Under `prefers-reduced-motion` the parallax offsets collapse to zero, the cards reveal without travel, the dock magnifier is pinned to its base size and smooth anchor scrolling falls back to instant.
- Section anchors carry `scroll-margin-top` so a jump stops below the fixed header rather than under it.

## Known constraints

- `backdrop-filter` must be written with `-webkit-` first and the standard property last. Lightning CSS, which Tailwind v4 runs, collapses the pair and keeps whichever comes last; with the order reversed the standard property never reaches the browser and the blur silently disappears.
- A `"use server"` module may only export async functions. Putting a constant
  or an object beside the action throws at runtime, not at build: the lead
  state type and its initial value live in `lib/lead.ts` for that reason.
- The lead form is `noValidate` and the server owns every message. Left to the
  browser, `required` blocks the request before the action runs, and the
  bubbles it shows cannot be styled and speak the browser's language.
- The theme script is inline, so a strict Content Security Policy without
  `'unsafe-inline'` would block it. Add a nonce if a CSP is ever introduced.
- The Spline scene must stay behind `SceneBoundary`. A failed fetch from its CDN surfaces as a render-time throw, and without a boundary React tears down the whole tree — header, hero and preloader with it, leaving a blank page and a scroll lock with nothing left running to release it.
- Layout properties belong in utilities, not in `globals.css`. Rules there load after Tailwind at equal specificity, so a `display` written next to the colours will quietly defeat responsive variants like `md:hidden`.

## Layout and behavior

- Desktop: two unequal grid columns, copy on the left and the scene on the right. The row height is set by the copy column, so the scene cell inherits the exact vertical span of the text; stacked composition remains active through tablet widths so the statement never collapses into a cramped column.
- Mobile: content stacks, with a 30svh floor under the 3D scene to prevent layout shift. Top padding clears the fixed header.
- The two primary actions sit directly below the supporting copy and wrap as a pair on narrow screens.
- CTA surfaces use a restrained liquid-metal rim while keeping high-contrast text on a dark center.
- Button hover and keyboard focus shift the silver surface toward violet chrome without moving its geometry.
- The Spline scene keeps a large fixed presentation scale and its authored cursor interaction instead of responsively shrinking the robot. An extra-wide, centered stage extends beyond the right column horizontally, so the model is never pinched by a narrow canvas.
- The robot reads from the head to the waist. The stage overruns its cell and a gradient mask dissolves the figure just above the hip joint: the head sits on the kicker line and the waist fades out on the line that closes the buttons. Both offsets are percentages of the cell, so the crop holds through copy changes and every breakpoint.
- The hero is full bleed: no rim, no radius, no shadow and no inset gutter, so the composition reads as the screen itself rather than as a card resting on it. The off-axis orbital line stays — it is the signature, not a frame.
- The hero is clipped vertically but not horizontally (`overflow: visible clip`). The masked lower half of the stage and the orbital line would otherwise occupy layout space and open a band of dead scroll below the fold.
- Stacked, the copy takes its natural height and the scene takes whatever is left, so the hero fills exactly one screen at any phone height.
- Pointer spotlight is enhancement only; content does not depend on hover.
- Motion respects `prefers-reduced-motion` and all owned scrollbars remain visible.
