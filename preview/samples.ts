// Sample card contents for the local preview: shapes and text that mimic the real
// consumers (bio/stack cards, MAL stats, Yandex recently-played).
import {
	type CardOptions,
	charsPerLine,
	esc,
	FONT_STACK,
	type Palette,
	wrapLines,
} from "../src/index.ts";

/** Image URL → data URI, downloaded by preview.ts (never committed). */
export type Images = Record<string, string>;

export interface Sample {
	name: string;
	options: Omit<CardOptions, "palette">;
	content: (p: Palette, img: Images) => string;
}

const W = 868;
const BODY = 16;
const LINE = 24;

const paragraph = (text: string, width: number, p: Palette) =>
	wrapLines(text, charsPerLine(width, BODY))
		.map(
			(l, i) =>
				`<text x="0" y="${16 + i * LINE}" fill="${p.text}" font-size="${BODY}">${esc(l)}</text>`,
		)
		.join("");

const truncate = (s: string, max: number) =>
	[...s].length > max ? `${[...s].slice(0, max - 1).join("")}…` : s;

/** An image clipped to 2px corners, with a 1px border on top. */
function picture(
	id: string,
	href: string | undefined,
	x: number,
	y: number,
	w: number,
	h: number,
	p: Palette,
): string {
	const box = `x="${x}" y="${y}" width="${w}" height="${h}"`;
	if (!href) return `<rect ${box} rx="2" fill="${p.border}"/>`;
	return (
		`<clipPath id="${id}"><rect ${box} rx="2"/></clipPath>` +
		`<image ${box} href="${href}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>` +
		`<rect ${box} rx="2" fill="none" stroke="${p.border}"/>`
	);
}

const BIO =
	"I write code by day and disappear into FL Studio by night, making tracks for the imaginary soundtrack of my own life.";
const STACK =
	"Java, C/C++, PL/SQL, SQL, PowerShell/Bash, CI/CD, Docker, message queues, clustering, load balancing, and enough CAP/PACELC theorem to argue about it at parties nobody invited me to.";

/** Real recently-played entries (covers from Yandex Music's public CDN). */
const TRACKS: [string, string, string][] = [
	[
		"ПРИЛЕТЕЛА",
		"MiatriSs",
		"https://avatars.yandex.net/get-music-content/20855185/d5b0727c.a.44081874-1/100x100",
	],
	[
		"Awakening",
		"Normandie",
		"https://avatars.yandex.net/get-music-content/98892/4fbc6e6c.a.5202310-1/100x100",
	],
	[
		"Go",
		"The Chemical Brothers, Q-Tip",
		"https://avatars.yandex.net/get-music-content/108289/6474a55e.a.8128644-1/100x100",
	],
	[
		"victory lap (extended version with an unreasonably long title that must be truncated)",
		"Windwaker",
		"https://avatars.yandex.net/get-music-content/14651289/0a287e3f.a.37909878-2/100x100",
	],
	[
		"Hard Feelings",
		"Poppy",
		"https://avatars.yandex.net/get-music-content/103235/754b6e64.a.6250730-1/100x100",
	],
];

/** Posters from MyAnimeList's public CDN. */
const ANIME: [string, string][] = [
	[
		"Sousou no Frieren",
		"https://cdn.myanimelist.net/images/anime/1015/138006.jpg",
	],
	[
		"Fullmetal Alchemist: Brotherhood",
		"https://cdn.myanimelist.net/images/anime/1208/94745.jpg",
	],
	[
		"Akuyaku Reijou Level 99: Watashi wa Ura-Boss desu ga Maou dewa Arimasen",
		"https://cdn.myanimelist.net/images/anime/1150/140028.jpg",
	],
];

export const IMAGE_URLS = [
	...TRACKS.map(([, , url]) => url),
	...ANIME.map(([, url]) => url),
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
		content: (p, img) => {
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
			const posters = ANIME.map(
				([title, url], i) =>
					picture(`mal-p${i}`, img[url], i * 290, 96, 60, 84, p) +
					wrapLines(title, charsPerLine(200, 13), 3)
						.map(
							(l, k) =>
								`<text x="${i * 290 + 72}" y="${110 + k * 17}" font-size="13" fill="${p.text}">${esc(l)}</text>`,
						)
						.join("") +
					`<text x="${i * 290 + 72}" y="172" font-size="11" fill="${p.subtext}">1mo ago</text>`,
			).join("");
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
		content: (p, img) =>
			`<g font-family="${FONT_STACK}">` +
			TRACKS.map(([title, artist, url], i) => {
				const y = i * 56;
				return (
					picture(`ym-c${i}`, img[url], 0, y, 48, 48, p) +
					`<text x="64" y="${y + 20}" font-size="16" font-weight="700" fill="${i === 0 ? p.accent : p.text}">${esc(truncate(title, 60))}</text>` +
					`<text x="64" y="${y + 40}" font-size="13" fill="${p.subtext}">${esc(artist)}</text>`
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
