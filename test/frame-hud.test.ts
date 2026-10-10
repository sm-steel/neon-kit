import { describe, expect, it } from "vitest";
import { brackets, panel } from "../src/frame.ts";
import { cursorAfter, cursorRect, hudCharWidth, hudTitle } from "../src/hud.ts";
import { FLAVORS } from "../src/palette.ts";

const p = FLAVORS.mocha;

describe("frame", () => {
	it("draws a square 1px-bordered panel", () => {
		expect(panel(771, 149, p)).toBe(
			'<rect x=".5" y=".5" width="770" height="148" fill="#11111b" stroke="#313244"/>',
		);
	});
	it("draws contrib-neon's four L brackets", () => {
		expect(brackets(771, 149, p)).toBe(
			'<path d="M4 14V4H14M757 4H767V14M4 135V145H14M757 145H767V135" fill="none" stroke="#cba6f7" stroke-width="1.5" stroke-opacity=".8"/>',
		);
	});
});

describe("hud", () => {
	it("measures 7.4px per character", () => {
		expect(hudCharWidth()).toBe(7.4);
		expect(cursorAfter("// CONTRIB.LOG :: @sm-steel", 16)).toBe(217.8);
	});
	it("counts code points, not UTF-16 units (Review Focus 5)", () => {
		expect(cursorAfter("A🎧", 0)).toBe(cursorAfter("AB", 0));
	});
	it("renders a // TITLE with a cursor and escapes text", () => {
		const svg = hudTitle("code & sound", 16, 26, p);
		expect(svg).toContain(">//</tspan> CODE &amp; SOUND</text>");
		expect(svg).toContain('class="nk-cur"');
		expect(svg).toContain(`x="${cursorAfter("// CODE & SOUND", 16)}"`);
	});
	it("places the cursor 5x9 above the baseline", () => {
		expect(cursorRect(100, 26, p)).toBe(
			'<rect class="nk-cur" x="100" y="18.5" width="5" height="9" fill="#cba6f7"/>',
		);
	});
});
