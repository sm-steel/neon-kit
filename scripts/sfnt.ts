// Minimal OpenType (sfnt) helpers for the font build and its tests: read/write the
// table directory, rebuild the `name` table, read `cmap` and advance widths.

export interface Sfnt {
	flavor: number;
	tables: Map<string, Buffer>;
}

export interface NameRecord {
	platform: number;
	encoding: number;
	language: number;
	id: number;
	bytes: Buffer;
}

const pad4 = (b: Buffer): Buffer => {
	const extra = (4 - (b.length % 4)) % 4;
	return extra ? Buffer.concat([b, Buffer.alloc(extra)]) : b;
};

export function checksum(b: Buffer): number {
	const p = pad4(b);
	let sum = 0;
	for (let i = 0; i < p.length; i += 4) sum = (sum + p.readUInt32BE(i)) >>> 0;
	return sum;
}

export function readSfnt(buf: Buffer): Sfnt {
	const tables = new Map<string, Buffer>();
	const count = buf.readUInt16BE(4);
	for (let i = 0; i < count; i++) {
		const o = 12 + i * 16;
		const offset = buf.readUInt32BE(o + 8);
		tables.set(
			buf.toString("latin1", o, o + 4),
			buf.subarray(offset, offset + buf.readUInt32BE(o + 12)),
		);
	}
	return { flavor: buf.readUInt32BE(0), tables };
}

export function writeSfnt({ flavor, tables }: Sfnt): Buffer {
	const tags = [...tables.keys()].sort();
	const n = tags.length;
	const entrySelector = Math.floor(Math.log2(n));
	const searchRange = 2 ** entrySelector * 16;
	const dir = Buffer.alloc(12 + n * 16);
	dir.writeUInt32BE(flavor, 0);
	dir.writeUInt16BE(n, 4);
	dir.writeUInt16BE(searchRange, 6);
	dir.writeUInt16BE(entrySelector, 8);
	dir.writeUInt16BE(n * 16 - searchRange, 10);

	const bodies: Buffer[] = [];
	let offset = dir.length;
	let headOffset = -1;
	tags.forEach((tag, i) => {
		let data = tables.get(tag) as Buffer;
		if (tag === "head") {
			data = Buffer.from(data);
			data.writeUInt32BE(0, 8); // checkSumAdjustment is computed last
			headOffset = offset;
		}
		const o = 12 + i * 16;
		dir.write(tag, o, "latin1");
		dir.writeUInt32BE(checksum(data), o + 4);
		dir.writeUInt32BE(offset, o + 8);
		dir.writeUInt32BE(data.length, o + 12);
		const padded = pad4(data);
		bodies.push(padded);
		offset += padded.length;
	});

	const out = Buffer.concat([dir, ...bodies]);
	if (headOffset >= 0)
		out.writeUInt32BE((0xb1b0afba - checksum(out)) >>> 0, headOffset + 8);
	return out;
}

export function readNames(table: Buffer): NameRecord[] {
	const count = table.readUInt16BE(2);
	const strings = table.readUInt16BE(4);
	const records: NameRecord[] = [];
	for (let i = 0; i < count; i++) {
		const o = 6 + i * 12;
		const len = table.readUInt16BE(o + 8);
		const off = strings + table.readUInt16BE(o + 10);
		records.push({
			platform: table.readUInt16BE(o),
			encoding: table.readUInt16BE(o + 2),
			language: table.readUInt16BE(o + 4),
			id: table.readUInt16BE(o + 6),
			bytes: table.subarray(off, off + len),
		});
	}
	return records;
}

export function writeNames(records: NameRecord[]): Buffer {
	const sorted = [...records].sort(
		(a, b) =>
			a.platform - b.platform ||
			a.encoding - b.encoding ||
			a.language - b.language ||
			a.id - b.id,
	);
	const header = Buffer.alloc(6 + sorted.length * 12);
	header.writeUInt16BE(0, 0);
	header.writeUInt16BE(sorted.length, 2);
	header.writeUInt16BE(header.length, 4);
	let off = 0;
	sorted.forEach((r, i) => {
		const o = 6 + i * 12;
		header.writeUInt16BE(r.platform, o);
		header.writeUInt16BE(r.encoding, o + 2);
		header.writeUInt16BE(r.language, o + 4);
		header.writeUInt16BE(r.id, o + 6);
		header.writeUInt16BE(r.bytes.length, o + 8);
		header.writeUInt16BE(off, o + 10);
		off += r.bytes.length;
	});
	return Buffer.concat([header, ...sorted.map((r) => r.bytes)]);
}

/** A Windows / Unicode BMP / en-US name record (UTF-16BE). */
export function winName(id: number, text: string): NameRecord {
	return {
		platform: 3,
		encoding: 1,
		language: 0x409,
		id,
		bytes: Buffer.from(text, "utf16le").swap16(),
	};
}

export function nameText(r: NameRecord): string {
	return r.platform === 1
		? r.bytes.toString("latin1")
		: Buffer.from(r.bytes).swap16().toString("utf16le");
}

/** Unicode code point → glyph id, from the best Unicode cmap subtable (format 12 or 4). */
export function readCmap(table: Buffer): Map<number, number> {
	const count = table.readUInt16BE(2);
	let fmt4 = -1;
	for (let i = 0; i < count; i++) {
		const o = 4 + i * 8;
		const platform = table.readUInt16BE(o);
		const encoding = table.readUInt16BE(o + 2);
		const offset = table.readUInt32BE(o + 4);
		const format = table.readUInt16BE(offset);
		const unicode =
			platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
		if (unicode && format === 12) return cmap12(table, offset);
		if (unicode && format === 4 && fmt4 < 0) fmt4 = offset;
	}
	if (fmt4 < 0)
		throw new Error("Font has no Unicode cmap subtable (format 4 or 12)");
	return cmap4(table, fmt4);
}

function cmap4(t: Buffer, o: number): Map<number, number> {
	const segX2 = t.readUInt16BE(o + 6);
	const ends = o + 14;
	const starts = ends + segX2 + 2;
	const deltas = starts + segX2;
	const ranges = deltas + segX2;
	const map = new Map<number, number>();
	for (let i = 0; i < segX2; i += 2) {
		const end = t.readUInt16BE(ends + i);
		const start = t.readUInt16BE(starts + i);
		const delta = t.readInt16BE(deltas + i);
		const rangeOffset = t.readUInt16BE(ranges + i);
		for (let c = start; c <= end && c !== 0xffff; c++) {
			let g: number;
			if (rangeOffset === 0) g = (c + delta) & 0xffff;
			else {
				g = t.readUInt16BE(ranges + i + rangeOffset + 2 * (c - start));
				if (g !== 0) g = (g + delta) & 0xffff;
			}
			if (g !== 0) map.set(c, g);
		}
	}
	return map;
}

function cmap12(t: Buffer, o: number): Map<number, number> {
	const groups = t.readUInt32BE(o + 12);
	const map = new Map<number, number>();
	for (let i = 0; i < groups; i++) {
		const p = o + 16 + i * 12;
		const start = t.readUInt32BE(p);
		const end = t.readUInt32BE(p + 4);
		const glyph = t.readUInt32BE(p + 8);
		for (let c = start; c <= end; c++) map.set(c, glyph + c - start);
	}
	return map;
}

/** Advance width of a code point's glyph in em units. */
export function advanceEm(font: Sfnt, codePoint: number): number {
	const table = (tag: string) => {
		const t = font.tables.get(tag);
		if (!t) throw new Error(`Font has no ${tag} table`);
		return t;
	};
	const gid = readCmap(table("cmap")).get(codePoint);
	if (gid === undefined)
		throw new Error(
			`Font has no glyph for U+${codePoint.toString(16).toUpperCase()}`,
		);
	const metrics = table("hhea").readUInt16BE(34);
	const advance = table("hmtx").readUInt16BE(4 * Math.min(gid, metrics - 1));
	return advance / table("head").readUInt16BE(18);
}
