// Sample card contents for the local preview: shapes and text that mimic the real
// consumers (bio/stack cards, MAL stats, Yandex recently-played).
import {
	type CardOptions,
	CHAR_WIDTH_EM,
	esc,
	FONT_STACK,
	type Palette,
} from "../src/index.ts";

export interface Sample {
	name: string;
	options: Omit<CardOptions, "palette">;
	content: (p: Palette) => string;
}

const W = 868;
const BODY = 16;
const LINE = 24;

/** Greedy word wrap for a monospace font. */
function wrap(text: string, width: number, size: number): string[] {
	const max = Math.floor(width / (size * CHAR_WIDTH_EM));
	const lines: string[] = [];
	let line = "";
	for (const word of text.split(" ")) {
		if (line && `${line} ${word}`.length > max) {
			lines.push(line);
			line = word;
		} else line = line ? `${line} ${word}` : word;
	}
	if (line) lines.push(line);
	return lines;
}

const paragraph = (text: string, width: number, p: Palette) =>
	wrap(text, width, BODY)
		.map(
			(l, i) =>
				`<text x="0" y="${16 + i * LINE}" fill="${p.text}" font-size="${BODY}">${esc(l)}</text>`,
		)
		.join("");

const truncate = (s: string, max: number) =>
	[...s].length > max ? `${[...s].slice(0, max - 1).join("")}…` : s;

const BIO =
	"I write code by day and disappear into FL Studio by night, making tracks for the imaginary soundtrack of my own life.";
const STACK =
	"Java, C/C++, PL/SQL, SQL, PowerShell/Bash, CI/CD, Docker, message queues, clustering, load balancing, and enough CAP/PACELC theorem to argue about it at parties nobody invited me to.";

const TRACKS = [
	["Ночной город", "MiatriSs"],
	["Awakening", "Normandie"],
	["Go", "The Chemical Brothers, Q-Tip"],
	[
		"victory lap (extended version with an unreasonably long title that must be truncated)",
		"Windwaker",
	],
	["Hard Feelings", "Poppy"],
];

export const SAMPLES: Sample[] = [
	{
		name: "bio",
		options: {
			width: 418,
			height: 4 * LINE,
			seed: "bio:code-sound",
			label: "Code & Sound",
			title: "Code & Sound",
			font: { variant: "text" },
		},
		content: (p) =>
			`<g font-family="${FONT_STACK}">${paragraph(BIO, 418, p)}</g>`,
	},
	{
		name: "stack",
		options: {
			width: W,
			height: 3 * LINE,
			seed: "stack:fluent",
			label: "Also Fluent In",
			title: "Also Fluent In",
			font: { variant: "text" },
		},
		content: (p) =>
			`<g font-family="${FONT_STACK}">${paragraph(STACK, W, p)}</g>`,
	},
	{
		name: "mal",
		options: {
			width: W,
			height: 200,
			seed: "mal",
			label: "Anime stats",
			title: "Anime Stats",
			font: { variant: "text", weights: [400, 700] },
		},
		content: (p) => {
			const stats = [
				["517", "Total"],
				["296", "Completed"],
				["33", "Watching"],
				["8.4", "Mean Score"],
				["86.7", "Days Watched"],
			];
			const tw = (W - 4 * 10) / 5;
			const tiles = stats
				.map(([v, l], i) => {
					const x = i * (tw + 10);
					return (
						`<rect x="${x}" y="0" width="${tw}" height="64" rx="2" fill="none" stroke="${p.border}"/>` +
						`<text x="${x + tw / 2}" y="32" text-anchor="middle" font-size="26" font-weight="700" fill="${p.accent}">${v}</text>` +
						`<text x="${x + tw / 2}" y="52" text-anchor="middle" font-size="13" fill="${p.text}">${l}</text>`
					);
				})
				.join("");
			const posters = [0, 1, 2]
				.map(
					(i) =>
						`<rect x="${i * 290}" y="96" width="60" height="84" rx="2" fill="${p.border}"/>` +
						`<text x="${i * 290 + 72}" y="114" font-size="13" fill="${p.text}">${esc(truncate("Sousou no Frieren Season 2", 26))}</text>`,
				)
				.join("");
			return `<g font-family="${FONT_STACK}">${tiles}${posters}</g>`;
		},
	},
	{
		name: "yandex",
		options: {
			width: W,
			height: 5 * 56 - 8,
			seed: "ym",
			label: "Recently played",
			title: "Recently Played",
			font: { variant: "text", weights: [400, 700] },
		},
		content: (p) =>
			`<g font-family="${FONT_STACK}">` +
			TRACKS.map(([title, artist], i) => {
				const y = i * 56;
				return (
					`<rect x="0" y="${y}" width="48" height="48" rx="2" fill="${p.border}"/>` +
					`<text x="64" y="${y + 20}" font-size="16" font-weight="700" fill="${i === 0 ? p.accent : p.text}">${esc(truncate(title ?? "", 60))}</text>` +
					`<text x="64" y="${y + 40}" font-size="13" fill="${p.subtext}">${esc(artist ?? "")}</text>`
				);
			}).join("") +
			`</g>`,
	},
	{
		name: "minimal",
		options: {
			width: 418,
			height: 2 * LINE,
			seed: "min",
			label: "Minimal",
			glitch: false,
			beam: false,
			font: { variant: "text" },
		},
		content: (p) =>
			`<g font-family="${FONT_STACK}">${paragraph("No glitch, no beam: frame, scanlines and boot only.", 418, p)}</g>`,
	},
];
