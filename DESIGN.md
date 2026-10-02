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

- A full-bleed overlay on the canvas: the liquid loader over the brand lockup — the app's gold symbol beside the name, the same lockup as the header.
- It waits on the Spline scene, the one genuinely slow asset, not on a fixed timer — but never long. A 0.8s floor keeps it from flashing on a warm cache; a 1s ceiling plus a 250ms fade means the page is open within 1.5s of navigation at most, as the owner asked — the timers start only once scripts have loaded, so the budget has to leave room for that. When the scene is slower than that, the hero shows its own "loading scene" state while the copy and buttons are already usable.
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

## Languages

- Russian, Uzbek (Latin), English and Simplified Chinese. The root layout lives
  under `app/[lang]`; all four prerender statically and anything else is a
  build-time 404. `<html lang>` carries the full tag: `ru`, `uz-Latn`, `en`,
  `zh-Hans`.
- `proxy.ts` — Next 16's name for middleware — sends a bare path to the saved
  choice, then `Accept-Language`, then Russian. Its matcher skips `_next` and
  file paths so assets are never redirected.
- Dictionaries in `lib/i18n/dictionaries` are typed against Russian: a missing
  or extra key fails the typecheck. Server sections read theirs through
  `next/root-params`; client components receive strings as props.
- The hero title is an array of lines, one per span, so each language keeps
  its own breaks.
- Terms follow each market: HS code in English, HS 编码 in Chinese, TIF TN in
  Uzbek. The Uzbek and Chinese dictionaries are drafts marked for review by a
  native speaker.
- The language switch is the theme switch at four stops: compact beside it on
  desktop, full width in the burger menu on phones. Only an explicit choice
  writes the `NEXT_LOCALE` cookie.

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
- A font's `unicode-range` is not a glyph inventory. Google's subset ranges
  are uniform across families: Manrope lists U+02BB yet has no glyph for it,
  and the browser silently drew the Uzbek mark in system Helvetica. Check with
  `CSS.getPlatformFontsForNode` before trusting coverage.
- Switching language remounts the `[lang]` root layout without reloading the
  document. Anything in that layout that should run once per visit — the
  preloader — needs state that outlives the remount; a head script only runs
  on a full load.
- Every WebGL canvas must be released with `releaseWebGL` (`lib/webgl.ts`)
  when its component unmounts. Paper Shaders' and Spline's `dispose()` free
  what is inside a context but leave the context to the garbage collector; a
  language switch remounts the whole page, so eight contexts leaked per switch
  until the browser hit its limit of sixteen and began killing the oldest.
  Release before `dispose()` — it removes the canvas.
- The Spline scene must stay behind `SceneBoundary`. A failed fetch from its CDN surfaces as a render-time throw, and without a boundary React tears down the whole tree — header, hero and preloader with it, leaving a blank page and a scroll lock with nothing left running to release it.
- Layout properties belong in utilities, not in `globals.css`. Rules there load after Tailwind at equal specificity, so a `display` written next to the colours will quietly defeat responsive variants like `md:hidden`.
- Deployment, decided 2026-10-02: the site runs on ahost shared hosting
  ("Micro", cPanel, Node.js), the application's API on a VPS at eskiz.uz. The
  API therefore sees the ahost server's address, shared with other customers'
  sites, for every visitor. Its sign-in limit is keyed by address (three a
  minute), so without help every visitor would share one counter. Trusting the
  ahost address in `TRUST_PROXY` is not an option: any neighbouring site could
  then forge a visitor's address. Instead the site vouches for the visitor's
  address in `x-site-client-ip` together with `x-site-proxy-key`, a secret
  known only to the site (`MYTAMGA_API_PROXY_KEY`) and the API
  (`SITE_PROXY_KEY`). The API's side is specified in
  `docs/API_SITE_PROXY_KEY_RU.md`; until it lands, sign-in shares one counter.
- The site's own reading of the visitor's address takes the rightmost
  `X-Forwarded-For` entry — the one ahost's front server appends. Confirm it on
  the live host by requesting codes from two networks and checking the API log
  shows two addresses (`docs/DEPLOY_RU.md`, verification step 6).
- Tests run on Node's built-in runner over TypeScript directly, so modules they
  cover import siblings **with** the `.ts` extension and never through the `@/`
  alias, which Node cannot resolve. `allowImportingTsExtensions` in
  `tsconfig.json` is what keeps TypeScript content with that.
- `next/server` cannot be loaded by the plain Node test runner. Logic worth
  testing therefore lives outside modules that import it — see
  `lib/api/authorized-call.ts` beside `lib/api/session.ts`.

- No page may read as a destination the app sends people to for payment. The
  app does not link to the site — App Store rule 3.1.3 forbids it outside the
  US and EU storefronts — so copy such as "return to the app" or "you came from
  the app" is wrong here. Saying the plan opens in the app after paying is fine.
- framer-motion moves scroll-linked opacity onto the browser's `ViewTimeline`.
  After the last explicit keyframe WAAPI interpolates back to the element's
  inline value, which for a reveal is 0. Every `useTransform` range that drives
  opacity must therefore end at 1; a range ending at 0.95 fades in and straight
  back out.
- Reduced motion is applied in CSS, not by branching on `useReducedMotion()` in
  render. On the server that hook does not know the setting, so a branch renders
  the moving state, the browser keeps those inline styles, and hydration warns.
  The footer uses `.footer-reveal` with `!important`, which beats both the
  inline style and the `ViewTimeline` animation. `components/capabilities.tsx`
  still branches and still warns under reduced motion.

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

## Billing

- Prices, plan names, feature and limit labels come from `GET /api/billing/plans`
  on the application's API. Nothing is written into this repository. A stale
  price would disagree with what the provider charges, which is worse than no
  price at all. `npm run check:catalog` compares the rendered page against the
  catalogue in all four languages; while prices are unannounced it checks the
  opposite, that no amount appears.
- `lib/billing/flags.ts` holds the stage. `PRICES_PUBLISHED` is `false` until the
  owner announces prices **and** the catalogue amount matches what the provider
  charges (`CLICK_PLAN_PRO_AMOUNT_UZS` in the application repository). The flag
  lives in code, not in an environment variable, so turning the checkout on is
  visible in a diff and passes review. `tests/flags.test.ts` fails when it flips,
  on purpose.
- "Under discussion" appears only where an amount exists and has not been
  announced — Pro and Business. Basic is labelled free forever, not a trial, and
  VIP as arranged on request: telling a visitor that a free plan's price is under
  discussion says it may one day cost money.
- The browser never talks to the application's API. Route handlers under
  `app/api/` do, and they keep tokens in `HttpOnly` cookies. Page scripts —
  Spline and the shaders, both from a CDN — cannot read them.
- Cookies use `SameSite=Lax`, never `Strict`: the visitor comes back from the
  payment provider's site, a cross-site navigation, and `Strict` would drop the
  session exactly when the return page needs it.
- Feature and limit labels are translated by their stable catalogue keys in
  `lib/billing/label-maps.ts`. Russian has no map: the catalogue is Russian
  already. An unknown key falls back to the catalogue's Russian label rather
  than rendering an empty line.
- The checkout reads the subscription before showing a pay button, so "only the
  owner can pay" (403) and "bought in an app store" (409) are explained up
  front instead of arriving after the click. `lib/billing/checkout-state.ts`
  makes that decision and is covered by tests, because getting it wrong leads a
  person into a refusal.
- **Paying and asking are different rights.** An organisation owner has
  `canManageSubscription` but not `canRequestUpgrade` — there is nobody to ask —
  and the upgrade-request endpoint answers 403. The request button appears only
  for whoever actually holds the right, normally an admin who cannot pay.
- Payment providers come from `GET /api/billing/payment-providers`. Only those
  reported `online` are offered. Click is implemented on the server; Payme and
  Uzum are stubs there, and Stripe cannot work for an Uzbek entity, so it is
  absent from the interface.
- Only Uzbek phone numbers can sign in: `normalizePhone` on the server takes
  twelve digits starting with 998. The English and Chinese pages say so.
- Amounts are grouped with U+202F, a narrow no-break space. Any script that
  compares rendered text must not collapse it: `\s` matches it in both
  JavaScript and Python, and collapsing it breaks every price comparison.

## Legal pages

- The privacy policy and terms of use are **not written here**. They already
  exist and are in force in the application's monorepo
  (`apps/api/public/legal/*/index.html`) and are carried over verbatim; two
  different documents under one name are worse than one.
  `npm run check:legal` reports drift when the application's text changes.
- Only the public offer is new, and it is marked a draft until a lawyer reads
  it. Click requires it, along with company details, to connect a merchant.
- Company details in `lib/legal/company.ts` are `null` until the owner supplies
  them, so the gap is detectable by a script rather than by re-reading a file.
  The support address `support@mytamga.uz` is real — it appears in both
  documents in the application.
- Legal text exists in Russian only. `uz`, `en` and `zh` state that the contract
  is concluded in Russian and link to it: an unreviewed translation of a contract
  is worse than no translation. The mechanism takes other languages the moment
  the text exists.

## Environment

`.env*` is gitignored, so the variables are documented here.

| Variable | Used by | Notes |
| --- | --- | --- |
| `MYTAMGA_API_URL` | route handlers, catalogue loading | The application's API, e.g. `http://localhost:3001` locally and `https://api.mytamga.uz` in production. Server-side only — no `NEXT_PUBLIC_` prefix, because the browser never calls the API. |
| `NEXT_PUBLIC_SITE_URL` | `generateMetadata` | Absolute base for canonical and hreflang links. |
| `MYTAMGA_API_PROXY_KEY` | `lib/api/server.ts` | Secret shared with the API (`SITE_PROXY_KEY` there). With it the site vouches for the visitor's address; see the deployment constraint above. Runtime only, never in the build. |
| `MYTAMGA_REPO` | `npm run check:legal` | Path to the application's monorepo for the legal-text comparison. Defaults to `../MyTamga`. |

Local development needs both servers: `npm run dev` here (port 3000) and
`npm run dev:api` in the application's monorepo (port 3001). The dev SMS
provider prints the sign-in code to the API console.

## Footer

- A curtain reveal: the wrapper sits in flow and is clipped with `clip-path`,
  the footer is fixed underneath it. Unlike `overflow`, `clip-path` clips fixed
  descendants, so the footer shows only within the wrapper and opens as the
  page scrolls. It is one full screen tall (`100svh`) on every page.
- Adapted from a 21st.dev component. Kept: the reveal, the outlined giant name,
  the tilted marquee, glass pills that follow the cursor, back to top. Changed:
  `gsap` replaced by framer-motion, which the site already ships; Plus Jakarta
  Sans dropped for the site's own faces; shadcn tokens mapped onto `--ink`,
  `--canvas`, `--accent`, so both themes work without extra rules.
- Content is the site's own: the heading is the hero statement, set in the
  display face with `--hero-title`, which is the one place that face is
  allowed; the marquee lists the four capabilities from the dictionary. The
  template's credit badge and sobriety-app copy are gone.
- App Store and Google Play buttons sit where the template had its download
  pills. The addresses live in `lib/app-links.ts`; while one is `null` the
  button reads "Coming soon to App Store" and is not a link — not `#`, and not
  the unpublished listing, which answers 404. Filling the address turns it into
  a link with the store's own caption. `isStoreUrl` checks the host and, for
  Google Play, the package `uz.tamga.navigator`, so a look-alike host fails.
- When the app is published, check Apple's App Store marketing guidelines: they
  ask for the official "Download on the App Store" badge artwork, and the
  current button is a pill with the logo instead.
- The company line is not animated and sits in the bottom bar on every page:
  Click checks it when connecting a merchant. The legal links have their own
  `nav`, labelled with `nav.footer`.
- The centred block is padded with its own `px`, not `--gutter`: it does not
  align with the page grid, and on wide screens the gutter pushed the fourth
  legal pill onto its own row.

## Company details and reference figures

- `lib/legal/company.ts` is the only place company details are written. Legal
  pages, the contact section and the footer line all read from it, so a
  correction after checking the registration certificate is made once.
- Chinese pages show the English registration form: an unofficial Chinese
  rendering of legal identifiers is worse than the one the owner supplied.
- Uzbek text uses U+2018 instead of U+02BB here too. Manrope has no U+02BB
  glyph. The Google Maps link keeps U+02BB percent-encoded, because it is a
  query, never drawn.
- The reference figures in "About" live in `lib/reference-counts.ts` with the
  date they were taken. No build script derives them from the reference data
  yet, and a stale figure on the trust section is worse than none.

## Brand assets

- Sources are the app's own files in `apps/mobile/assets/` of the application
  repository; nothing was redrawn. They are raster PNGs — a transparent SVG of
  the logo still does not exist and would be better everywhere below.
- The site uses the gold symbol (`tamga-symbol.png`) beside the name set in
  text, in the header and the preloader. Not the full horizontal logo: its
  silver "TAMGA" with a light halo all but disappears on the light theme, and
  its tagline is unreadable at header height. The name stays real text, so it
  is crisp, translatable to screen readers and searchable.
- `public/brand/tamga-symbol.png` is trimmed and resized to 192px tall for a
  mark shown at 28–36px — 46 KB instead of the 648 KB source.
- The full logo appears only in the link preview (`app/opengraph-image.png`),
  set on the dark canvas where it reads as designed.
- The browser tab icon (`app/icon.png`, `app/favicon.ico`) is the gold symbol
  on transparency, legible on light and dark tab bars. The iPhone home screen
  icon (`app/apple-icon.png`) is the app's own square icon, because iOS needs
  an opaque square and a visitor should see the same icon as the app.
- The preview's absolute URL is built from `NEXT_PUBLIC_SITE_URL`; without it
  in production the preview points at localhost.

## Deployment package

- `output: "standalone"` in `next.config.ts`: the build copies only the files
  the server needs into `.next/standalone` — about 66 MB and 1,600 files
  against 519 MB and 26,000 in `node_modules`. The ahost "Micro" plan has 1 GB
  of disk and a 50,000-file limit.
- `npm run package:ahost` builds and zips it into `dist/mytamga-site.zip`. It
  refuses to run without `NEXT_PUBLIC_SITE_URL` and `MYTAMGA_API_URL`, or with
  localhost in either: the site address is baked into canonical, hreflang and
  the preview image URL at build time.
- The link preview lives in `app/[lang]/`, not `app/`. From the app root it
  ignored the `metadataBase` set by the locale layout and kept pointing at
  localhost even with `NEXT_PUBLIC_SITE_URL` set — found by test-running the
  built package. Next serves it at `/-/opengraph-image.png`, which the locale
  redirect leaves alone because the path has a dot.
- Step-by-step upload to cPanel: `docs/DEPLOY_RU.md`.
