import { describe, expect, it } from "vitest";
import { FLAVORS, isFlavor, PALETTE_KEYS } from "../src/palette.ts";

describe("palette", () => {
	it("uses crust panels for dark flavors and base for latte", () => {
		expect(FLAVORS.mocha.background).toBe("#11111b");
		expect(FLAVORS.macchiato.background).toBe("#181926");
		expect(FLAVORS.frappe.background).toBe("#232634");
		expect(FLAVORS.latte.background).toBe("#eff1f5");
		expect(FLAVORS.latte.dark).toBe(false);
		expect(FLAVORS.mocha.dark).toBe(true);
	});
	it("keeps contrib-neon's accent, border and glitch colors", () => {
		expect(FLAVORS.mocha).toMatchObject({
			border: "#313244",
			accent: "#cba6f7",
			glitchA: "#f38ba8",
			glitchB: "#89dceb",
		});
	});
	it("knows its flavors", () => {
		expect(isFlavor("frappe")).toBe(true);
		expect(isFlavor("espresso")).toBe(false);
		expect(isFlavor("toString")).toBe(false);
	});
	it("lists every palette key for validation", () => {
		expect([...PALETTE_KEYS].sort()).toEqual(Object.keys(FLAVORS.mocha).sort());
	});
});
