import { describe, expect, it } from "vitest";
import { card } from "../src/card.ts";
import { REDUCED_MOTION_CSS } from "../src/effects.ts";
import { cardGrid } from "../src/grid.ts";
import { FLAVORS } from "../src/palette.ts";

const p = FLAVORS.mocha;
const opts = (seed: string) => ({
	width: 200,
	height: 40,
	palette: p,
	seed,
	label: seed,
	title: seed,
});
const content = '<text x="0" y="12">hi</text>';

describe("card ns option", () => {
	it("leaves the default output unchanged", () => {
		expect(card({ ...opts("a"), ns: "nk" }, content)).toBe(
			card(opts("a"), content),
		);
	});

	it("renames every kit id, class and keyframe, but not content or label", () => {
		const svg = card(
			{ ...opts("a"), label: "nk-label", ns: "nk3" },
			'<g id="nk-mine" class="nk-x">hi</g>',
		);
		const kitPart = svg
			.replace('<g id="nk-mine" class="nk-x">hi</g>', "")
			.replace('aria-label="nk-label"', "")
			.replace("<title>nk-label</title>", "");
		expect(kitPart).not.toMatch(/nk-/);
		expect(svg).toContain('id="nk3-content"');
		expect(svg).toContain("@keyframes nk3-boot");
		expect(svg).toContain('<g id="nk-mine" class="nk-x">hi</g>');
		expect(svg).toContain('aria-label="nk-label"');
	});

	it("rejects namespaces that aren't simple identifiers", () => {
		expect(() => card({ ...opts("a"), ns: "a b" }, content)).toThrow(/ns/);
		expect(() => card({ ...opts("a"), ns: "1x" }, content)).toThrow(/ns/);
	});
});

describe("cardGrid", () => {
	const grid = () =>
		cardGrid(
			{
				width: 500,
				height: 120,
				label: "bio & stack",
				font: { variant: "text", weights: [400, 700] },
			},
			[
				{ x: 0, y: 0, options: opts("one"), content },
				{ x: 250, y: 0, options: opts("two"), content },
			],
		);

	it("embeds the font once for the whole image", () => {
		expect(grid().match(/@font-face/g)).toHaveLength(2); // 400 + 700, once each
	});

	it("namespaces each card separately and positions it", () => {
		const svg = grid();
		expect(svg).toContain('id="nk0-content"');
		expect(svg).toContain('id="nk1-content"');
		expect(svg).toContain('<svg x="0" y="0"');
		expect(svg).toContain('<svg x="250" y="0"');
		expect(svg).toContain('viewBox="0 0 500 120"');
	});

	it("gives each card its own glitch timing", () => {
		const svg = grid();
		const kf = (ns: string) =>
			svg.match(new RegExp(`@keyframes ${ns}-gk0\\{[^}]*\\}`))?.[0];
		expect(kf("nk0")).toBeDefined();
		expect(kf("nk0")?.replace("nk0", "")).not.toBe(
			kf("nk1")?.replace("nk1", ""),
		);
	});

	it("escapes the label and ends with the reduced-motion stylesheet", () => {
		const svg = grid();
		expect(svg).toContain('aria-label="bio &amp; stack"');
		expect(svg.endsWith(`<style>${REDUCED_MOTION_CSS}</style></svg>`)).toBe(
			true,
		);
	});

	it("rejects an empty grid and bad sizes", () => {
		expect(() => cardGrid({ width: 100, height: 100, label: "x" }, [])).toThrow(
			/cells/,
		);
		expect(() =>
			cardGrid({ width: 0, height: 100, label: "x" }, [
				{ x: 0, y: 0, options: opts("a"), content },
			]),
		).toThrow(/width/);
	});
});
