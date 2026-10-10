import { HUD_400, TEXT_400, TEXT_700 } from "./font-data.ts";

export const FONT_FAMILY = "ContribNeon Mono";
/** Embedded font first; system monospace fonts cover any glyph it lacks. */
export const FONT_STACK = `'${FONT_FAMILY}',ui-monospace,'Cascadia Code',SFMono-Regular,Menlo,Consolas,monospace`;
/** Monaspace Neon advance width; every glyph is this wide. */
export const CHAR_WIDTH_EM = 0.62;

export type FontVariant = "hud" | "text";
export type FontWeight = 400 | 700;

const face = (b64: string, weight: FontWeight) =>
	`@font-face{font-family:'${FONT_FAMILY}';font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format('woff2')}`;

/**
 * CSS @font-face rules embedding Monaspace Neon (renamed ContribNeon Mono).
 * "hud": ASCII only, regular (~10 KB). "text": ASCII + Latin-1 + Cyrillic, regular and/or bold (~19 KB each).
 */
export function fontFace(
	variant: FontVariant,
	weights: FontWeight[] = [400],
): string {
	if (variant === "hud") {
		if (weights.some((w) => w !== 400))
			throw new Error('The "hud" font variant only has weight 400');
		return face(HUD_400, 400);
	}
	return weights.map((w) => face(w === 700 ? TEXT_700 : TEXT_400, w)).join("");
}
