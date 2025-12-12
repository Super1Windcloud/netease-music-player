import { Buffer } from "buffer";
import { Asset } from "expo-asset";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { inflate } from "pako";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

type PlayerImageColors = {
	background: string;
	primary: string;
};

const colorCache = new Map<string, PlayerImageColors>();

const concatUint8Arrays = (chunks: Uint8Array[]) => {
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	chunks.forEach((chunk) => {
		result.set(chunk, offset);
		offset += chunk.length;
	});
	return result;
};

const decodeUint32BE = (bytes: Uint8Array, offset: number) =>
	(bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];

const readRgbaFromPng = (pngBytes: Uint8Array): [number, number, number, number] | null => {
	// Basic PNG signature check
	if (
		pngBytes.length < 24 ||
		pngBytes[0] !== 0x89 ||
		pngBytes[1] !== 0x50 ||
		pngBytes[2] !== 0x4e ||
		pngBytes[3] !== 0x47
	) {
		return null;
	}

	let offset = 8; // Skip signature
	const idatChunks: Uint8Array[] = [];

	while (offset + 8 <= pngBytes.length) {
		const length = decodeUint32BE(pngBytes, offset);
		const type = String.fromCharCode(
			pngBytes[offset + 4],
			pngBytes[offset + 5],
			pngBytes[offset + 6],
			pngBytes[offset + 7],
		);

		if (type === "IDAT") {
			idatChunks.push(pngBytes.slice(offset + 8, offset + 8 + length));
		} else if (type === "IEND") {
			break;
		}

		offset += 12 + length;
	}

	if (!idatChunks.length) return null;

	try {
		const compressed = concatUint8Arrays(idatChunks);
		const decompressed = inflate(compressed);

		// After resizing to 1x1 RGBA, decompressed data should be [filter, R, G, B, A]
		if (decompressed.length < 5) return null;

		return [decompressed[1], decompressed[2], decompressed[3], decompressed[4]];
	} catch (error) {
		console.warn("Failed to parse PNG data", error);
		return null;
	}
};

const rgbaString = (rgba: [number, number, number, number]) => {
	const [r, g, b, a] = rgba;
	const alpha = Math.max(0, Math.min(1, a / 255));
	return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
};

const deriveColorsFromImage = async (imageUrl: string) => {
	const resolveLocalImageUri = async () => {
		if (
			imageUrl.startsWith("file:") ||
			imageUrl.startsWith("content:") ||
			imageUrl.startsWith("data:")
		) {
			return imageUrl;
		}

		try {
			const asset = Asset.fromURI(imageUrl);
			await asset.downloadAsync();
			return asset.localUri ?? asset.uri;
		} catch (error) {
			console.warn("Failed to cache image for color extraction", error);
			return null;
		}
	};

	try {
		const localUri = await resolveLocalImageUri();
		if (!localUri) return null;

		const context = ImageManipulator.manipulate(localUri).resize({ width: 1, height: 1 });
		const rendered = await context.renderAsync();
		const result = await rendered.saveAsync({
			compress: 0,
			format: SaveFormat.PNG,
			base64: true,
		});

		if (!result.base64) return null;

		// Metro/RN polyfills Buffer by default
		const pngBytes = Uint8Array.from(Buffer.from(result.base64, "base64"));
		const rgba = readRgbaFromPng(pngBytes);
		if (!rgba) return null;

		return {
			background: rgbaString(rgba),
			primary: rgbaString(rgba),
		};
	} catch (error) {
		console.warn("Failed to derive colors from image", error);
		return null;
	}
};

export const usePlayerBackground = (imageUrl: string) => {
	const [imageColors, setImageColors] = useState<PlayerImageColors | null>(null);
	const { colors } = useTheme();

	const fallbackColors = useMemo<PlayerImageColors>(
		() => ({
			background: colors.background,
			primary: colors.primary,
		}),
		[colors.background, colors.primary],
	);

	useEffect(() => {
		let isMounted = true;

		const resolveColors = async () => {
			if (!imageUrl) {
				setImageColors(fallbackColors);
				return;
			}

			const cached = colorCache.get(imageUrl);
			if (cached) {
				setImageColors(cached);
				return;
			}

			setImageColors(fallbackColors);

			const derived = await deriveColorsFromImage(imageUrl);
			if (!isMounted) return;

			if (derived) {
				colorCache.set(imageUrl, derived);
				setImageColors(derived);
			} else {
				setImageColors(fallbackColors);
			}
		};

		resolveColors().catch((error) => {
			console.warn("Unable to resolve player background colors", error);
			setImageColors(fallbackColors);
		});

		return () => {
			isMounted = false;
		};
	}, [fallbackColors, imageUrl]);

	return { imageColors };
};
