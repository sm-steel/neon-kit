export interface Palette {
	dark: boolean;
	background: string;
	border: string;
	empty: string;
	/** Colors for levels 1-4. */
	levels: [string, string, string, string];
	/** Hot center drawn on level-4 cells. */
	core: string;
	text: string;
	subtext: string;
	accent: string;
	/** Chromatic-aberration channel colors for glitch frames. */
	glitchA: string;
	glitchB: string;
}

// https://catppuccin.com/palette
const catppuccin = {
	latte: {
		base: "#eff1f5",
		crust: "#dce0e8",
		surface0: "#ccd0da",
		overlay0: "#9ca0b0",
		text: "#4c4f69",
		subtext0: "#6c6f85",
		blue: "#1e66f5",
		lavender: "#7287fd",
		mauve: "#8839ef",
		pink: "#ea76cb",
		red: "#d20f39",
		sky: "#04a5e5",
	},
	frappe: {
		base: "#303446",
		crust: "#232634",
		surface0: "#414559",
		overlay0: "#737994",
		text: "#c6d0f5",
		subtext0: "#a5adce",
		blue: "#8caaee",
		lavender: "#babbf1",
		mauve: "#ca9ee6",
		pink: "#f4b8e4",
		red: "#e78284",
		sky: "#99d1db",
	},
	macchiato: {
		base: "#24273a",
		crust: "#181926",
		surface0: "#363a4f",
		overlay0: "#6e738d",
		text: "#cad3f5",
		subtext0: "#a5adcb",
		blue: "#8aadf4",
		lavender: "#b7bdf8",
		mauve: "#c6a0f6",
		pink: "#f5bde6",
		red: "#ed8796",
		sky: "#91d7e3",
	},
	mocha: {
		base: "#1e1e2e",
		crust: "#11111b",
		surface0: "#313244",
		overlay0: "#6c7086",
		text: "#cdd6f4",
		subtext0: "#a6adc8",
		blue: "#89b4fa",
		lavender: "#b4befe",
		mauve: "#cba6f7",
		pink: "#f5c2e7",
		red: "#f38ba8",
		sky: "#89dceb",
	},
};

export type Flavor = keyof typeof catppuccin;

function fromFlavor(name: Flavor): Palette {
	const c = catppuccin[name];
	const dark = name !== "latte";
	return {
		dark,
		background: dark ? c.crust : c.base,
		border: c.surface0,
		empty: c.surface0,
		levels: [c.blue, c.lavender, c.mauve, c.pink],
		core: dark ? "#ffffff" : c.base,
		text: c.text,
		subtext: c.subtext0,
		accent: c.mauve,
		glitchA: c.red,
		glitchB: c.sky,
	};
}

export const FLAVORS: Record<Flavor, Palette> = {
	latte: fromFlavor("latte"),
	frappe: fromFlavor("frappe"),
	macchiato: fromFlavor("macchiato"),
	mocha: fromFlavor("mocha"),
};

export function isFlavor(name: string): name is Flavor {
	return Object.hasOwn(FLAVORS, name);
}

export const PALETTE_KEYS = [
	"dark",
	"background",
	"border",
	"empty",
	"levels",
	"core",
	"text",
	"subtext",
	"accent",
	"glitchA",
	"glitchB",
] as const satisfies readonly (keyof Palette)[];
