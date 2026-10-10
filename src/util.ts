const ESC: Record<string, string> = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	'"': "&quot;",
	"'": "&apos;",
};

/** Escapes text for use in SVG/XML content and attribute values. */
export const esc = (s: string): string =>
	s.replace(/[<>&"']/g, (ch) => ESC[ch] as string);

/** Rounds to at most 3 decimals, so SVG/CSS output stays short and stable. */
export const r3 = (n: number): number => {
	const v = +n.toFixed(3);
	return Object.is(v, -0) ? 0 : v;
};

/** Deterministic PRNG (mulberry32) seeded from a string, returning [0, 1). */
export function seeded(text: string): () => number {
	let h = 1779033703 ^ text.length;
	for (let i = 0; i < text.length; i++) {
		h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	let a = h >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
