import { describe, expect, it } from "vitest";
import {
	beam,
	beamCss,
	beamDefs,
	bootCss,
	CURSOR_CSS,
	glitchLayer,
	REDUCED_MOTION_CSS,
	scanlineDefs,
	scanlines,
	TEAR_SECONDS,
	tintDefs,
} from "../src/effects.ts";
import { FLAVORS } from "../src/palette.ts";

const dark = FLAVORS.mocha;
const light = FLAVORS.latte;
const region = { width: 300, height: 120 };

describe("scanlines", () => {
	it("uses dark/light line colors from the spec", () => {
		expect(scanlineDefs(dark)).toContain('fill="#000000" fill-opacity="0.28"');
		expect(scanlineDefs(light)).toContain(
			`fill="${light.text}" fill-opacity="0.05"`,
		);
		expect(scanlines(region)).toBe(
			'<rect width="300" height="120" fill="url(#nk-sl)" pointer-events="none"/>',
		);
	});
});

describe("beam", () => {
	it("is a 40px band, stronger on dark", () => {
		expect(beamDefs(dark)).toContain('stop-opacity="0.09"');
		expect(beamDefs(light)).toContain('stop-opacity="0.06"');
		expect(beam(region)).toContain('class="nk-bm" width="300" height="40"');
		expect(beamCss(region, { period: 6, delay: 0.5 })).toContain(
			"animation:nk-bm 6s 0.5s linear infinite",
		);
		expect(beamCss(region, { period: 6, delay: 0.5 })).toContain(
			"translateY(120px)",
		);
	});
});

describe("glitchLayer", () => {
	const spec = {
		target: "nk-content",
		tears: [{ y: 20, h: 10, at: 40, dx: 4 }],
		band: { x: 8, width: 284 },
		period: 10,
		start: 0.5,
		background: dark.background,
	};
	it("clips a copy of the target with red/cyan split copies", () => {
		const g = glitchLayer(spec);
		expect(g.defs).toBe(
			'<clipPath id="nk-k0"><rect x="8" y="20" width="284" height="10"/></clipPath>',
		);
		expect(g.svg).toContain(
			'<use href="#nk-content" filter="url(#nk-ta)" x="-2" opacity=".85"/>',
		);
		expect(g.svg).toContain(
			'<use href="#nk-content" filter="url(#nk-tb)" x="2" opacity=".85"/>',
		);
		expect(g.css).toContain("animation:nk-gk0 10s 0.5s steps(1,end) infinite");
	});
	it("lasts TEAR_SECONDS of the cycle", () => {
		const pct = (TEAR_SECONDS / 10) * 100;
		const g = glitchLayer(spec);
		expect(g.css).toContain(
			`${+(40 + pct).toFixed(3)}%,100%{opacity:0;transform:none}`,
		);
	});
	it("returns nothing for no tears", () => {
		expect(glitchLayer({ ...spec, tears: [] })).toEqual({
			defs: "",
			css: "",
			svg: "",
		});
	});
});

describe("css", () => {
	it("has boot, cursor and reduced-motion rules", () => {
		expect(bootCss(0.5)).toContain(
			".nk-boot{animation:nk-boot 0.5s ease-out both}",
		);
		expect(bootCss(0.5)).toContain(
			".nk-brk{animation:nk-brk 0.5s ease-out both}",
		);
		expect(CURSOR_CSS).toContain(
			".nk-cur{animation:nk-blink 1.1s steps(1,end) infinite}",
		);
		expect(REDUCED_MOTION_CSS).toBe(
			"@media (prefers-reduced-motion:reduce){*{animation:none!important}}",
		);
	});
	it("tint filters cover the whole region", () => {
		expect(tintDefs(dark, region)).toContain(
			'<filter id="nk-ta" filterUnits="userSpaceOnUse" x="0" y="0" width="300" height="120">',
		);
		expect(tintDefs(dark, region)).toContain(`flood-color="${dark.glitchA}"`);
	});
});
