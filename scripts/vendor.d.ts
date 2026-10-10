declare module "subset-font" {
	interface Options {
		targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
		noLayoutClosure?: boolean;
		variationAxes?: Record<
			string,
			number | { min: number; max: number; default?: number }
		>;
	}
	export default function subsetFont(
		font: Buffer | Uint8Array,
		text: string,
		options?: Options,
	): Promise<Buffer>;
}

declare module "wawoff2" {
	const wawoff2: {
		compress(sfnt: Uint8Array): Promise<Uint8Array>;
		decompress(woff2: Uint8Array): Promise<Uint8Array>;
	};
	export default wawoff2;
}
