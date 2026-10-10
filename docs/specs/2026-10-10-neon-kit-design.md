# neon-kit design (2026-10-10)

## Context

`sm-steel/contrib-neon` introduced a cyberpunk "neon panel" look: a square panel with a 1px border, mauve L-shaped corner brackets, faint scanlines, a rolling scan beam, a CRT boot flicker, red/cyan glitch tears and a Monaspace HUD header. The other cards on the `sm-steel` profile still use the older style: rounded 14px cards on a Mocha-base slab. The user wants every card we render to share the contrib-neon look. The frame and corner brackets are mandatory.

Agreed scope for the whole effort, with each sub-project getting its own spec, plan and approval:

1. **neon-kit** (this spec): a shared TypeScript package with the look and effects, plus contrib-neon refactored onto it.
2. Bio and Stack cards (`sm-steel/scripts/render-cards.mjs`): static PNGs become animated SVGs built on neon-kit.
3. MAL stats widget: ported from Python to TypeScript on Vercel, using neon-kit.
4. Yandex widget: ported to TypeScript and changed from "now playing" (the flaky Ynison WebSocket) to "recently played, 5 items" via `GET https://api.music.yandex.net/music-history?fullModelsCount=15`. This approach was proven by a throwaway test on 2026-10-10: HTTP 200 in ~0.15s, full track models with title, artists and `coverUri`. `fullModelsCount` counts history entries, not tracks, so the widget requests about 15 and keeps the first 5 tracks that have a `fullModel`.
5. Profile README: `<picture>` updates, plus streak-stats URL tweaks (`border_radius=0`, crust background, surface0 border). Typing headers, the capsule divider, metrics.svg and badges stay as they are.

Card extras the user chose: scanlines, HUD-style titles, transparent backdrop (no slab behind the cards), 2px inner radii, rolling scan beam, glitch tears, boot flicker and a blinking cursor.

## Package

- **Repo:** `sm-steel/neon-kit`, published to npm as `@sm-steel/neon-kit`. MIT.
- **Format:** TypeScript, ESM only, Node ≥ 22. Ships built JS plus `.d.ts` files. **No runtime dependencies.**
- **Tooling:** pinned with mise. Biome, Vitest, esbuild (JS) and `tsc --emitDeclarationOnly` (types).
- **Output:** everything returns SVG strings, because every consumer produces SVG text. The bio cards wrap satori's SVG output.

### Modules (`src/`)

| Module | Exports | Notes |
|---|---|---|
| `palette.ts` | `FLAVORS`, `Flavor`, `Palette`, `isFlavor()` | Moved from contrib-neon unchanged: Catppuccin latte/frappe/macchiato/mocha. The panel is `crust` for dark flavors and `base` for latte. Border is `surface0`, accent is `mauve`, glitch colors are `red` and `sky`. |
| `font.ts` | `FONT_FAMILY`, `fontFace(variant, weights?)`, `CHAR_WIDTH_EM = 0.62` | The `hud` variant is ASCII (~14 KB embedded). The `text` variant is ASCII + Latin-1 + Cyrillic + punctuation (~28 KB embedded per weight), with regular and bold available. |
| `frame.ts` | `frame({width,height,palette})`, `brackets(...)` | Square panel at `x=y=.5` with a 1px `border` stroke. Brackets sit 4px inside the edge, with 10px arms, a 1.5px stroke and 0.8 opacity, in `accent`. |
| `effects.ts` | `effectDefs()`, `effectCss()`, `glitchLayer()`, `scanlines()`, `beam()` | Scanline pattern: 3px period, 1px line, black at 0.28 on dark, `text` at 0.05 on light. Beam gradient uses `accent`. Glitch tears are clipped `<use>` copies of a target id, tinted with flood filters. A seeded PRNG (mulberry32) picks their timing. A `prefers-reduced-motion` rule turns every animation off. |
| `hud.ts` | `hudTitle(text, x, y, palette)`, `cursor(...)` | Renders `// TEXT` in uppercase: accent `//`, letter-spacing 1.2, size 10. The cursor rect sits at `x + len × (size × 0.62 + spacing) + 2`. |
| `card.ts` | `card(opts, contentSvg)` | The high-level wrapper, described below. |
| `util.ts` | `esc()`, `seeded()` | XML escaping and the PRNG. |
| `index.ts` | re-exports everything | |

### `card()`

```ts
card({
  width, height,          // content area (inner) size in px
  palette,                // Palette
  seed,                   // string; drives glitch row/shift/offset
  label,                  // aria-label + <title>
  title?,                 // optional HUD title (adds the header row + cursor)
  glitch = true, beam = true, boot = true, scanlines = true,
}, contentSvg: string): string
```

- **Outer size:** content plus 16px of padding on each side, plus a 22px header row when `title` is set.
- **Layers, bottom to top:** panel → title → `<g id="content">` (content shifted by the padding) → glitch copies → scanlines → beam → brackets.
- **Timings:**
  - Boot: 0.5s flicker, played once. The brackets fade in at the same time.
  - Beam: sweeps every 6s.
  - Glitch: one 120 ms tear per ~10s cycle. Row band, shift (3–6px) and cycle offset all come from `seed`.
  - Cursor: blinks every 1.1s.
- **Light palettes** (`dark: false`): beam opacity 0.06 instead of 0.09 and lighter scanlines, the same rules as contrib-neon. (Glow scaling stays in contrib-neon's grid code. `card()` has no glow layer.)
- **Errors:** throws `Error` with a clear message when a width or height is ≤ 0, when content is empty, or when a palette field is missing. `title` and `label` are escaped internally. Content is the caller's responsibility, and `esc()` is exported for it.

### Font build (`scripts/build-font.ts`, TypeScript, no Python)

1. Download the **variable** TrueType `Monaspace Neon Var.woff2` from `githubnext/monaspace` at tag `v1.400`, and verify SHA-256 `6569968f448ae856ab5b57dff1f13b109b220ca8e3f664169e135fcb5c4f0721`. *(Revised during planning: the static files are CFF fonts whose internal CFF names keep "Monaspace", which a `name`-table rewrite can't reach.)*
2. Subset and instance with `subset-font` (HarfBuzz): `noLayoutClosure: true`, `variationAxes: { wght: 400|700, wdth: 100, slnt: 0 }`. That produces static TrueType with no CFF table, ~14.5 KB WOFF2 per weight for the `text` set. It also drops ligatures and texture healing, which contrib-neon already disables.
3. Rebuild the `name` table with family `ContribNeon Mono`, as the OFL Reserved Font Name clause requires for a Monaspace subset. The source keeps its copyright and Reserved Font Name notice in **ID 7** and the license in ID 13, and HarfBuzz keeps only IDs 1–6. So ID 7 → ID 0, ID 13 → ID 13, and ID 14 is set to the OFL URL. Drop `STAT`. This is a small sfnt rewriter with recalculated checksums.
4. Compress with `wawoff2` and write the result to `src/font-data.ts` as base64.
5. Fail the build if Cyrillic U+0410–U+044F is missing, if the advance width of `A` ≠ 0.62 em, or if the copyright or license records are missing.

`subset-font` and `wawoff2` are devDependencies only. `fonts/OFL.txt` is shipped. The spike measured ASCII at 10.5 KB WOFF2 and ASCII + Latin-1 + Cyrillic + punctuation at 21.5 KB WOFF2.

## Preview gate (mandatory, before any release or consumer change)

`node src/preview.ts` writes `preview/out/index.html`. It shows these samples, each on GitHub light (#ffffff) and dark (#0d1117) backgrounds, rendered in Latte and Mocha, with Frappé and Macchiato in a smaller row:

1. **Bio-style card:** HUD title `// CODE & SOUND` and two paragraphs of body text.
2. **Stack-style wide card:** `// ALSO FLUENT IN` with a long single paragraph.
3. **MAL-style card:** a row of 5 stat tiles (2px radius) and 3 poster placeholders.
4. **Yandex recently-played card:** 5 rows with a cover placeholder (2px radius), title and artist. It includes a **Cyrillic** title and a long title that gets truncated.
5. **Minimal card:** `glitch=false, beam=false`.

The user reviews it live in their browser, served from `127.0.0.1`. I check it with headless-Chromium `--virtual-time-budget` frame grabs. **The user must approve the look before the npm release and before contrib-neon or any other consumer changes.**

## Release

- CI runs on every push: lint, typecheck, tests, the font build check and a build.
- Pushing a `v*` tag runs a job that does `npm publish --provenance --access public`, authenticated by an `NPM_TOKEN` repository secret. The user creates the npm account/token. That step can't be done for them.
- Versioning is semver, and consumers pin `^1`.

## First consumer: contrib-neon v1.1.0

- contrib-neon switches its palette, font, frame/brackets, scanlines, beam and glitch code to `@sm-steel/neon-kit`. It keeps its own grid boot and per-level glow.
- Existing tests must pass. Before/after frames (headless Chromium) are shown to the user, because the font update from v1.101 to v1.400 may slightly change some header letter shapes. That difference needs explicit approval.
- After approval: tag `v1.1.0`, move `v1`, and confirm the profile workflow still renders.

## Testing

- **Unit:**
  - frame geometry
  - bracket path
  - cursor x
  - glitch timing determinism per seed, and difference across seeds
  - reduced-motion rule present
  - escaping
  - error cases
- **Snapshot:** `card()` output for a fixed sample, so visual changes show up as reviewable diffs.
- **Font build:** the coverage and metric assertions listed above.
- **Visual:** the preview gate.

## Out of scope

- Restyling metrics.svg, typing headers, the capsule divider and badges.
- Replacing streak-stats.
- Glyphs beyond Latin and Cyrillic, such as CJK or kana; those fall back to system fonts.
