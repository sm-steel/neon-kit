import { CHAR_WIDTH_EM, FONT_STACK } from "./font.ts";
import type { Palette } from "./palette.ts";
import { esc, r3 } from "./util.ts";

export const HUD = { size: 10, spacing: 1.2 } as const;

export const hudCharWidth = (): number =>
	r3(HUD.size * CHAR_WIDTH_EM + HUD.spacing);

/** x of the cursor placed 2px after `text` drawn at `x` (monospace, so width = chars × advance). */
export const cursorAfter = (text: string, x: number): number =>
	r3(x + [...text].length * hudCharWidth() + 2);

export function cursorRect(x: number, baseline: number, p: Palette): string {
	return `<rect class="nk-cur" x="${r3(x)}" y="${r3(baseline - 7.5)}" width="5" height="9" fill="${p.accent}"/>`;
}

/** `// TITLE` heading (uppercased) with a blinking cursor after it. */
export function hudTitle(
	text: string,
	x: number,
	baseline: number,
	p: Palette,
): string {
	const shown = text.toUpperCase();
	return (
		`<g font-family="${FONT_STACK}" font-size="${HUD.size}" letter-spacing="${HUD.spacing}">` +
		`<text x="${r3(x)}" y="${r3(baseline)}" fill="${p.text}"><tspan fill="${p.accent}">//</tspan> ${esc(shown)}</text>` +
		cursorRect(cursorAfter(`// ${shown}`, x), baseline, p) +
		`</g>`
	);
}
