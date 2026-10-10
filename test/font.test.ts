import { describe, expect, it } from "vitest";
import wawoff2 from "wawoff2";
import {
	advanceEm,
	nameText,
	readCmap,
	readNames,
	readSfnt,
} from "../scripts/sfnt.ts";
import {
	CHAR_WIDTH_EM,
	FONT_FAMILY,
	FONT_STACK,
	fontFace,
} from "../src/font.ts";
import { HUD_400, TEXT_400, TEXT_700 } from "../src/font-data.ts";

const open = async (b64: string) =>
	readSfnt(Buffer.from(await wawoff2.decompress(Buffer.from(b64, "base64"))));

describe("embedded fonts", () => {
	it.each([
		["HUD_400", HUD_400],
		["TEXT_400", TEXT_400],
		["TEXT_700", TEXT_700],
	])("%s is renamed TrueType with notices kept", async (_, b64) => {
		const font = await open(b64);
		expect(font.tables.has("CFF ")).toBe(false);
		const names = new Map(
			readNames(font.tables.get("name") as Buffer).map((r) => [
				r.id,
				nameText(r),
			]),
		);
		expect(names.get(1)).toBe(FONT_FAMILY);
		expect(names.get(0)).toMatch(/GitHub/);
		expect(names.get(13)).toMatch(/Open Font License/);
		// OFL Reserved Font Name: no identifying name record may say "Monaspace"
		for (const id of [1, 2, 3, 4, 5, 6])
			expect(names.get(id) ?? "").not.toMatch(/monaspace/i);
		// the credit lives in the description instead
		expect(names.get(10)).toMatch(/subset of Monaspace Neon 1\.400/);
		expect(advanceEm(font, 0x41)).toBe(CHAR_WIDTH_EM);
	});

	it("text variants cover Cyrillic, hud covers ASCII only", async () => {
		const text = readCmap((await open(TEXT_400)).tables.get("cmap") as Buffer);
		const hud = readCmap((await open(HUD_400)).tables.get("cmap") as Buffer);
		for (const ch of "Привет, ночной город! Ёё")
			expect(text.has(ch.codePointAt(0) as number)).toBe(true);
		expect(hud.has(0x41f)).toBe(false);
		expect(hud.has(0x7e)).toBe(true);
	});
});

describe("fontFace", () => {
	it("emits one @font-face per requested weight", () => {
		const css = fontFace("text", [400, 700]);
		expect(css.match(/@font-face/g)).toHaveLength(2);
		expect(css).toContain("font-weight:700");
		expect(css).toContain(`font-family:'${FONT_FAMILY}'`);
	});
	it("defaults to regular and rejects bold hud", () => {
		expect(fontFace("hud").match(/@font-face/g)).toHaveLength(1);
		expect(() => fontFace("hud", [700])).toThrow(/hud/);
	});
	it("falls back to system monospace fonts", () => {
		expect(FONT_STACK.startsWith(`'${FONT_FAMILY}',`)).toBe(true);
		expect(FONT_STACK.endsWith("monospace")).toBe(true);
	});
});
