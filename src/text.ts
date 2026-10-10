import { CHAR_WIDTH_EM } from "./font.ts";

/** How many whole monospace glyphs of `size` px fit into `width` px. */
export const charsPerLine = (width: number, size: number): number =>
	Math.floor(width / (size * CHAR_WIDTH_EM));

/**
 * Greedy word wrap for the embedded monospace font, counting code points.
 * Words longer than a line are hard-broken. With `maxLines`, text that doesn't
 * fit is cut after the last allowed line, which then ends with "…".
 */
export function wrapLines(
	text: string,
	maxChars: number,
	maxLines = Number.POSITIVE_INFINITY,
): string[] {
	if (!(maxChars >= 1))
		throw new Error(`wrapLines: maxChars must be at least 1, got ${maxChars}`);
	if (!(maxLines >= 1))
		throw new Error(`wrapLines: maxLines must be at least 1, got ${maxLines}`);
	const len = (s: string) => [...s].length;
	const lines: string[] = [];
	let line = "";
	for (const word of text.trim().split(/\s+/).filter(Boolean)) {
		let chars = [...word];
		while (chars.length > maxChars) {
			if (line) lines.push(line);
			lines.push(chars.slice(0, maxChars).join(""));
			chars = chars.slice(maxChars);
			line = "";
		}
		const rest = chars.join("");
		if (!rest) continue;
		if (!line) line = rest;
		else if (len(line) + 1 + len(rest) <= maxChars) line = `${line} ${rest}`;
		else {
			lines.push(line);
			line = rest;
		}
	}
	if (line) lines.push(line);
	if (lines.length <= maxLines) return lines;

	const kept = lines.slice(0, maxLines);
	const last = [...(kept[maxLines - 1] as string)];
	kept[maxLines - 1] =
		`${(last.length >= maxChars ? last.slice(0, maxChars - 1) : last).join("")}…`;
	return kept;
}
