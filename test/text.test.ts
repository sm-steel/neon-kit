import { describe, expect, it } from "vitest";
import { charsPerLine, wrapLines } from "../src/text.ts";

describe("charsPerLine", () => {
	it("fits whole monospace glyphs (0.62em each) into a width", () => {
		expect(charsPerLine(200, 13)).toBe(24); // 200 / 8.06
		expect(charsPerLine(418, 16)).toBe(42);
	});
});

describe("wrapLines", () => {
	it("wraps at word boundaries", () => {
		expect(wrapLines("Fullmetal Alchemist: Brotherhood", 24)).toEqual([
			"Fullmetal Alchemist:",
			"Brotherhood",
		]);
	});

	it("keeps short text on one line, without an ellipsis", () => {
		expect(wrapLines("Steins;Gate", 24, 3)).toEqual(["Steins;Gate"]);
	});

	it("caps at maxLines and ends the last line with an ellipsis that fits", () => {
		const lines = wrapLines(
			"Akuyaku Reijou Level 99: Watashi wa Ura-Boss desu ga Maou dewa Arimasen",
			20,
			3,
		);
		expect(lines).toEqual([
			"Akuyaku Reijou Level",
			"99: Watashi wa",
			"Ura-Boss desu ga…",
		]);
		for (const l of lines) expect([...l].length).toBeLessThanOrEqual(20);
	});

	it("hard-breaks a single word longer than a line", () => {
		expect(wrapLines("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
	});

	it("counts code points, so Cyrillic and emoji wrap correctly", () => {
		// 4 emoji = 4 code points but 8 UTF-16 units: they fit one 6-char line only if counted as code points
		expect(wrapLines("Привет мир 🎧🎧🎧🎧", 6)).toEqual([
			"Привет",
			"мир",
			"🎧🎧🎧🎧",
		]);
	});

	it("collapses runs of whitespace and returns [] for blank text", () => {
		expect(wrapLines("  a   b  ", 10)).toEqual(["a b"]);
		expect(wrapLines("   ", 10)).toEqual([]);
	});

	it("adds the ellipsis even when the cut lands exactly at a line end", () => {
		expect(wrapLines("aaaa bbbb cccc", 4, 2)).toEqual(["aaaa", "bbb…"]);
	});
});
