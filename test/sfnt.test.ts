import { describe, expect, it } from "vitest";
import {
	checksum,
	nameText,
	readNames,
	readSfnt,
	winName,
	writeNames,
	writeSfnt,
} from "../scripts/sfnt.ts";

function headTable(): Buffer {
	const head = Buffer.alloc(54);
	head.writeUInt32BE(0x00010000, 0); // version
	head.writeUInt32BE(0x5f0f3cf5, 12); // magic
	head.writeUInt16BE(2000, 18); // unitsPerEm
	return head;
}

describe("name table", () => {
	it("round-trips Windows Unicode records, including Cyrillic", () => {
		const recs = [winName(1, "ContribNeon Mono"), winName(4, "Тест Regular")];
		const back = readNames(writeNames(recs));
		expect(back.map((r) => [r.id, nameText(r)])).toEqual([
			[1, "ContribNeon Mono"],
			[4, "Тест Regular"],
		]);
	});
	it("sorts records by platform, encoding, language, id", () => {
		const back = readNames(writeNames([winName(6, "b"), winName(1, "a")]));
		expect(back.map((r) => r.id)).toEqual([1, 6]);
	});
});

describe("sfnt container", () => {
	it("round-trips tables and fixes the whole-font checksum", () => {
		const font = {
			flavor: 0x00010000,
			tables: new Map<string, Buffer>([
				["name", writeNames([winName(1, "X")])],
				["head", headTable()],
				["abc ", Buffer.from([1, 2, 3])], // odd length forces padding
			]),
		};
		const out = writeSfnt(font);
		expect(checksum(out)).toBe(0xb1b0afba);
		const back = readSfnt(out);
		expect([...back.tables.keys()]).toEqual(["abc ", "head", "name"]);
		expect([...(back.tables.get("abc ") as Buffer)]).toEqual([1, 2, 3]);
		expect(nameText(readNames(back.tables.get("name") as Buffer)[0])).toBe("X");
	});
});
