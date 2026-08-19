# Birthday Gift Experience

A multi-page interactive birthday experience, built with React + TypeScript + Vite,
Framer Motion, and CSS Modules — following the original build spec.

**Status: Pages 1–3 are fully built.** Pages 4–6 (DOB Vault & Gallery, Letter,
Feedback & Closing) are stubbed behind a "coming soon" placeholder and will
be built next, following the same architecture.

## Getting started

```bash
npm install
npm run dev      # starts a local dev server, usually http://localhost:5173
npm run build    # type-checks and builds a production bundle to dist/
npm run preview  # serves the production build locally
```

Requires Node.js 18+.

## What's implemented

### Page 1 — Countdown & Cake Assembly

- **Countdown**: counts down to a real target date/time (set in
  `Page1.tsx` as `BIRTHDAY_TARGET`, currently **September 15, 2026, 12:00 AM**
  local time). While more than 10 seconds remain it shows a live
  days/hours/minutes/seconds display; for the final 10 seconds (from
  11:59:50 PM on Sep 14) it switches into the spring-scale 10 → 0 bounce
  with a tick sound on every count (Web Audio API, no audio file needed),
  landing on 🎉 exactly at the target moment. It reads the real system
  clock, so it's correct no matter when the page is opened or refreshed.
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

### Page 2 — Vintage Photo Booth

- **Live camera**: `getUserMedia` viewfinder, 3:4 aspect ratio, mirrored for
  a natural selfie view. Gracefully handles denied/unavailable camera access
  with a "Skip this page" fallback so the experience never dead-ends.
- **Capture flow**: a 3-2-1 countdown (with tick beeps) before each of 3
  shots, a flash effect, and a short pause between shots.
- **Vintage filter**: applied via raw canvas pixel manipulation (warm tint,
  grain, vignette) in `vintageFilter.ts` — no image-processing library
  needed.
- **Photo strip**: the 3 shots render as a vertical strip with a timestamp
  on each photo, downloadable as a single composited PNG.
- **Draggable stickers**: ✨🎀⭐ can be dragged anywhere on the strip via
  native Pointer Events (no drag library needed).
- Captured photos are saved to the shared `UserData.photoStrip`, so a later
  gallery page can reuse them.

### Page 3 — Music Player

- **Playlist**: sample tracks defined in `tracks.ts` with per-line synced
  lyrics. No audio files are bundled — drop mp3s into `public/audio/` and
  set each track's `audioSrc` (e.g. `/audio/track-1.mp3`) to enable real
  playback.
- **Works with zero audio files**: without a source, the player simulates a
  play clock (`requestAnimationFrame`) so the vinyl spin, seek bar, and
  lyric sync are all fully previewable end-to-end.
- **Controls**: play/pause, next/previous, shuffle, repeat, a seek bar, and
  a volume slider.
- **Synced lyrics**: the active line scales up, glows, and auto-scrolls into
  view as playback (real or simulated) progresses.
- **Vinyl record**: spins continuously while playing via a Framer Motion
  rotation loop.

## Architecture notes

- **State machine**: `src/types.ts` + `src/context/AppContext.tsx` implement
  the `AppState` / `AppAction` / `UserData` model from the spec via
  `useReducer`, exposed through `useAppContext()`. `App.tsx` reads
  `currentPage` and renders the matching page.
- **Per-page local types**: state/data that's only relevant inside one page
  (e.g. `CakeElement` for Page 1, `Track`/`LyricLine` for Page 3) lives in
  that page's own `types.ts` rather than the global one, so pages stay
  independent.
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
  visible content is decorative (e.g. balloons, player icon buttons), and
  the wish modal is a focus-trapped `role="dialog"` that closes on `Escape`.
- Canvas particle loops (fireworks, smoke) are skipped entirely under
  reduced motion rather than just sped up, to avoid unnecessary CPU/battery
  use.
- Global `:focus-visible` outline restores a visible keyboard focus ring,
  since `cursor: none` removes the usual mouse affordance.
- The photo booth never dead-ends on denied camera permissions — there's
  always a "Skip this page" path.

## Bring your own media

- **Audio**: drop mp3s into `public/audio/` and reference them from
  `src/pages/Page3/tracks.ts` (`audioSrc: '/audio/track-1.mp3'`). Adjust the
  `duration` and lyric `time` values to match your actual file.
- **Photos**: Page 2 captures live photos via the camera — no files needed.
  Later pages (the gallery) can reuse `UserData.photoStrip`.
- Page 1's tick/pop sounds are synthesized in-browser on purpose, so that
  page works with zero assets.

## Next steps

Page 4 (DOB Vault & Gallery) is next: a passcode-locked digital locker that
unlocks a masonry photo/video gallery, per the original spec.
