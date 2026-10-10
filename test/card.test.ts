import { describe, expect, it } from "vitest";
import { CARD, card, cardTears } from "../src/card.ts";
import { REDUCED_MOTION_CSS } from "../src/effects.ts";
import { FLAVORS } from "../src/palette.ts";

const base = {
	width: 300,
	height: 80,
	palette: FLAVORS.mocha,
	seed: "bio:code-sound",
	label: "Code & Sound",
};
const content = '<text x="0" y="12">hello</text>';

describe("card", () => {
	it("matches the snapshot for a fixed sample", () => {
		expect(card({ ...base, title: "Code & Sound" }, content)).toMatchSnapshot();
	});

	it("sizes the outer frame from the content box", () => {
		const svg = card(base, content);
		expect(svg).toContain(
			`width="${300 + 2 * CARD.pad}" height="${80 + 2 * CARD.pad}"`,
		);
		const titled = card({ ...base, title: "x" }, content);
		expect(titled).toContain(`height="${80 + 2 * CARD.pad + CARD.titleRow}"`);
	});

	it("layers panel, content, glitch, scanlines, beam, brackets in order", () => {
		const svg = card(base, content);
		const order = [
			'fill="#11111b" stroke',
			'id="nk-content"',
			'class="nk-gk0"',
			"url(#nk-sl)",
			'class="nk-bm"',
			'class="nk-brk"',
		];
		const positions = order.map((s) => svg.indexOf(s));
		expect(positions.every((p) => p >= 0)).toBe(true);
		expect([...positions].sort((a, b) => a - b)).toEqual(positions);
	});

	it("toggles effects off", () => {
		const svg = card(
			{ ...base, glitch: false, beam: false, scanlines: false, boot: false },
			content,
		);
		expect(svg).not.toContain("nk-gk");
		expect(svg).not.toContain('class="nk-bm"');
		expect(svg).not.toContain("url(#nk-sl)");
		expect(svg).not.toContain("nk-boot{");
		expect(svg).toContain("prefers-reduced-motion");
	});

	it("emits the reduced-motion rule as the last stylesheet, after any CSS in the content", () => {
		const animated =
			'<style>.spin{animation:spin 1s infinite}</style><text class="spin">x</text>';
		const svg = card({ ...base, title: "t" }, animated);
		expect(svg.endsWith(`<style>${REDUCED_MOTION_CSS}</style></svg>`)).toBe(
			true,
		);
		expect(svg.indexOf(REDUCED_MOTION_CSS)).toBeGreaterThan(
			svg.indexOf(".spin{animation"),
		);
	});

	it("embeds the hud font only when a title is set, unless overridden", () => {
		expect(card(base, content)).not.toContain("@font-face");
		expect(
			card({ ...base, title: "t" }, content).match(/@font-face/g),
		).toHaveLength(1);
		expect(
			card(
				{ ...base, font: { variant: "text", weights: [400, 700] } },
				content,
			).match(/@font-face/g),
		).toHaveLength(2);
	});

	// Review Focus 1
	it("escapes title and label", () => {
		const svg = card({ ...base, label: `a<b>&"c'`, title: "x & <y>" }, content);
		expect(svg).toContain('aria-label="a&lt;b&gt;&amp;&quot;c&apos;"');
		expect(svg).toContain("<title>a&lt;b&gt;&amp;&quot;c&apos;</title>");
		expect(svg).toContain("X &amp; &lt;Y&gt;");
	});

	// Review Focus 2
	it("prefixes every kit id with nk-", () => {
		const svg = card(
			{ ...base, title: "t" },
			'<g id="mine"><rect id="sl"/></g>',
		);
		const ids = [...svg.matchAll(/ id="([^"]+)"/g)]
			.map((m) => m[1])
			.filter((id) => id !== "mine" && id !== "sl");
		expect(ids.length).toBeGreaterThan(0);
		for (const id of ids) expect(id?.startsWith("nk-")).toBe(true);
	});

	// Review Focus 3
	it("keeps tears inside very short content", () => {
		for (const seed of ["a", "b", "c", "d", "e"]) {
			for (const t of cardTears(seed, { y: 16, height: 12 })) {
				expect(t.h).toBeGreaterThan(0);
				expect(t.y).toBeGreaterThanOrEqual(16);
				expect(t.y + t.h).toBeLessThanOrEqual(28 + 1e-6);
			}
		}
	});

	// Review Focus 4
	it("rounds fractional sizes to 3 decimals", () => {
		const svg = card(
			{ ...base, width: 418.66666666, height: 77.123456789 },
			content,
		);
		expect(svg).not.toMatch(/\d\.\d{4,}/);
		expect(svg).not.toMatch(/\de-\d/);
	});

	it("gives different seeds different tear timings", () => {
		const area = { y: 16, height: 80 };
		expect(cardTears("bio:a", area)).not.toEqual(cardTears("bio:b", area));
		expect(cardTears("bio:a", area)).toEqual(cardTears("bio:a", area));
	});

	it("rejects bad input with clear messages", () => {
		expect(() => card({ ...base, width: 0 }, content)).toThrow(/width/);
		expect(() => card({ ...base, height: Number.NaN }, content)).toThrow(
			/height/,
		);
		expect(() => card(base, "   ")).toThrow(/content/);
		const { accent: _, ...broken } = FLAVORS.mocha;
		expect(() =>
			card({ ...base, palette: broken as typeof FLAVORS.mocha }, content),
		).toThrow(/accent/);
	});
});
