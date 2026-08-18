# Birthday Gift Experience

A multi-page interactive birthday experience, built with React + TypeScript + Vite,
Framer Motion, and CSS Modules — following the original build spec.

**Status: Page 1 (Countdown & Cake Assembly) is fully built.** Pages 2–6
(Photo Booth, Music Player, DOB Vault & Gallery, Letter, Feedback & Closing)
are stubbed behind a "coming soon" placeholder and will be built next, one at
a time, following the same architecture.

## Getting started

```bash
npm install
npm run dev      # starts a local dev server, usually http://localhost:5173
npm run build    # type-checks and builds a production bundle to dist/
npm run preview  # serves the production build locally
```

Requires Node.js 18+.

## What's implemented (Page 1)

- **Countdown**: 10 → 0 with spring-scale numbers, a tick sound on every
  count (generated with the Web Audio API — no audio file needed), and a
  pulsing background.
- **Fireworks & balloons**: a canvas 2D particle system launches fireworks
  bursts, with drifting decorative balloons in the background. Skippable.
- **Cake assembly**: plate, layers, cream, chocolate/strawberry toppings, and
  five candles drop in sequentially with spring-physics bounce.
- **Make a wish**: a glassmorphic modal where the wish is typed in; it's
  saved to the shared `UserData` context so later pages (e.g. the Page 5
  letter) can reference it.
- **Blow out the candles**: a click triggers a wind-streak sweep, each flame
  extinguishing, and rising smoke wisps.
- **Balloon pop finale**: poppable balloons with playful messages; a gold
  balloon reveals the user's actual wish on a rotated polaroid card, with a
  "Continue →" button that advances the app state machine to Page 2.

## Architecture notes

- **State machine**: `src/types.ts` + `src/context/AppContext.tsx` implement
  the `AppState` / `AppAction` / `UserData` model from the spec via
  `useReducer`, exposed through `useAppContext()`. `App.tsx` reads
  `currentPage` and renders the matching page.
- **Per-page local types**: state/data that's only relevant inside one page
  (e.g. `CakeElement`, `Particle`, `Balloon` for Page 1) lives in that page's
  own `types.ts` rather than the global one, so pages stay independent.
- **CSS Modules**: each component/page has a co-located `*.module.css` file.
  Shared design tokens (colors, fonts, spacing) live in
  `src/styles/global.css` as CSS custom properties.
- **No Framer Motion in the artifact sandbox, but available here**: this is
  a real npm project, so `framer-motion` is a normal dependency (unlike a
  single-file chat artifact, which can't install packages).

## Accessibility & performance choices

- Custom cursor and decorative sparkle trail are disabled automatically on
  touch devices and for anyone with `prefers-reduced-motion` set — the
  native cursor and instant transitions are restored instead.
- All interactive elements are real `<button>`s with `aria-label`s where the
  visible content is decorative (e.g. balloons), and the wish modal is a
  focus-trapped `role="dialog"` that closes on `Escape`.
- Canvas particle loops (fireworks, smoke) are skipped entirely under
  reduced motion rather than just sped up, to avoid unnecessary CPU/battery
  use.
- Global `:focus-visible` outline restores a visible keyboard focus ring,
  since `cursor: none` removes the usual mouse affordance.

## Bring your own media

The spec calls for real photos, a photo strip, background music, and video
in later pages. None of that is included here — drop files into `public/`
(e.g. `public/audio/`, `public/photos/`) and reference them by path
(`/audio/track.mp3`) once those pages are built. Page 1's tick/pop sounds
are synthesized in-browser on purpose so the experience works with zero
assets.

## Next steps

Page 2 (Vintage Photo Booth) is next: `getUserMedia` camera capture, a
canvas-based vintage filter, and a downloadable photo strip, per the
original spec.
