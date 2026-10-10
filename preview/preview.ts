// Local preview: renders every sample in every flavor and an index.html that shows them
// on GitHub's light and dark backgrounds via <img> (like GitHub does).
// Usage: node preview/preview.ts [--serve]   → http://127.0.0.1:8766/
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { card, FLAVORS, type Flavor } from "../src/index.ts";
import { IMAGE_URLS, type Images, SAMPLES } from "./samples.ts";

const OUT = "preview/out";
await mkdir(OUT, { recursive: true });

const big: Flavor[] = ["latte", "mocha"];
const small: Flavor[] = ["frappe", "macchiato"];
const sections: string[] = [];

/** Downloads each sample image once (cached in preview/out/cache) and returns data URIs. */
async function loadImages(): Promise<Images> {
	const cache = join(OUT, "cache");
	await mkdir(cache, { recursive: true });
	const images: Images = {};
	for (const url of IMAGE_URLS) {
		const file = join(cache, createHash("sha1").update(url).digest("hex"));
		let data: Buffer;
		try {
			data = await readFile(file);
		} catch {
			const res = await fetch(url);
			if (!res.ok) {
				console.warn(`image ${res.status}: ${url} (placeholder used)`);
				continue;
			}
			data = Buffer.from(await res.arrayBuffer());
			await writeFile(file, data);
		}
		images[url] = `data:image/jpeg;base64,${data.toString("base64")}`;
	}
	return images;
}

const images = await loadImages();

for (const s of SAMPLES) {
	for (const f of [...big, ...small]) {
		await writeFile(
			join(OUT, `${s.name}-${f}.svg`),
			card(
				{ ...s.options, palette: FLAVORS[f] },
				s.content(FLAVORS[f], images),
			),
		);
	}
	// natural size (no stretching), so sizes compare the way they will on GitHub
	const img = (f: Flavor) =>
		`<figure><img src="${s.name}-${f}.svg"><figcaption>${f}</figcaption></figure>`;
	sections.push(
		`<h2>${s.name}</h2>` +
			`<div class="light">${img("latte")}</div>` +
			`<div class="dark">${img("mocha")}<div class="row">${small.map(img).join("")}</div></div>`,
	);
}

await writeFile(
	join(OUT, "index.html"),
	`<!doctype html><meta charset="utf-8"><title>neon-kit preview</title>
<style>
body{margin:0;font:14px system-ui;background:#888}
header{position:sticky;top:0;z-index:1;padding:10px 16px;background:#222;color:#eee;display:flex;gap:12px;align-items:center}
h2{margin:0;padding:16px 16px 0;font-size:13px;color:#fff;background:#444}
.light,.dark{padding:16px}.light{background:#fff}.dark{background:#0d1117;color:#e6edf3}
.row{display:flex;flex-wrap:wrap;gap:16px;margin-top:16px}
figure{margin:0}figcaption{font-size:12px;opacity:.6;margin-top:4px}img{display:block;max-width:100%}
</style>
<header><b>neon-kit preview</b><button onclick="for(const i of document.images)i.src=i.src.split('?')[0]+'?t='+Date.now()">Replay animations</button></header>
${sections.join("\n")}`,
);
console.log(
	`preview: ${OUT}/index.html (${SAMPLES.length} samples × 4 flavors)`,
);

if (process.argv.includes("--serve")) {
	const types: Record<string, string> = {
		".html": "text/html; charset=utf-8",
		".svg": "image/svg+xml",
	};
	createServer((req, res) => {
		const file = join(
			OUT,
			decodeURIComponent((req.url ?? "/").split("?")[0] as string).replace(
				/^\/$/,
				"/index.html",
			),
		);
		// join() normalizes separators (backslashes on Windows), so compare against join(OUT)
		if (!file.startsWith(join(OUT))) return void res.writeHead(403).end();
		res.setHeader(
			"Content-Type",
			types[extname(file)] ?? "application/octet-stream",
		);
		createReadStream(file)
			.on("error", () => res.writeHead(404).end())
			.pipe(res);
	}).listen(8766, "127.0.0.1", () =>
		console.log("serving http://127.0.0.1:8766/"),
	);
}
