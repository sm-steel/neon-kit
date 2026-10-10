import { describe, expect, it } from "vitest";
import { esc, r3, seeded } from "../src/util.ts";

describe("esc", () => {
	it("escapes all five XML specials", () => {
		expect(esc(`a<b>&"c'`)).toBe("a&lt;b&gt;&amp;&quot;c&apos;");
	});
	it("leaves Cyrillic and emoji alone", () => {
		expect(esc("Привет 🎧")).toBe("Привет 🎧");
	});
});

describe("r3", () => {
	it("rounds to at most 3 decimals", () => {
		expect(r3(418.66666666)).toBe(418.667);
		expect(r3(0.1 + 0.2)).toBe(0.3);
		expect(String(r3(1e-7))).toBe("0");
	});
});

describe("seeded", () => {
	it("is deterministic per seed and differs across seeds", () => {
		const a = seeded("x");
		const b = seeded("x");
		const c = seeded("y");
		const seqA = [a(), a(), a()];
		expect([b(), b(), b()]).toEqual(seqA);
		expect([c(), c(), c()]).not.toEqual(seqA);
		for (const v of seqA) expect(v >= 0 && v < 1).toBe(true);
	});
	it("matches contrib-neon's generator (same first value for 'sm-steel')", () => {
		// contrib-neon src/rng.ts, seeded("glitch:sm-steel")() — pinned so glitch layouts stay identical after migration
		expect(seeded("glitch:sm-steel")()).toMatchSnapshot();
	});
});
