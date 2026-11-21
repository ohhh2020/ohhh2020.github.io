import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants.ts";
import { expressiveCodeConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

export const PRISM_PRESETS = [
	"obsidian-dark",
	"warm-dark",
	"daylight-crystal",
	"warm-alabaster",
] as const;

export type PrismPreset = (typeof PRISM_PRESETS)[number];

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

export function getStoredPrismPreset(): PrismPreset {
	const stored = localStorage.getItem("prism-preset") as PrismPreset;
	if (stored && PRISM_PRESETS.includes(stored)) {
		return stored;
	}
	const storedTheme = localStorage.getItem("theme");
	if (storedTheme === "light") return "daylight-crystal";
	return "obsidian-dark";
}

export function setPrismPreset(preset: PrismPreset): void {
	localStorage.setItem("prism-preset", preset);
	const isDark = preset === "obsidian-dark" || preset === "warm-dark";
	localStorage.setItem("theme", isDark ? "dark" : "light");

	const root = document.documentElement;
	root.setAttribute("data-prism-preset", preset);
	if (isDark) {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	const currentPreset = getStoredPrismPreset();
	const root = document.documentElement;

	switch (theme) {
		case LIGHT_MODE:
			root.classList.remove("dark");
			if (currentPreset === "obsidian-dark" || currentPreset === "warm-dark") {
				root.setAttribute("data-prism-preset", "daylight-crystal");
			} else {
				root.setAttribute("data-prism-preset", currentPreset);
			}
			break;
		case DARK_MODE:
			root.classList.add("dark");
			if (currentPreset === "daylight-crystal" || currentPreset === "warm-alabaster") {
				root.setAttribute("data-prism-preset", "obsidian-dark");
			} else {
				root.setAttribute("data-prism-preset", currentPreset);
			}
			break;
		case AUTO_MODE: {
			const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			if (isDark) {
				root.classList.add("dark");
				root.setAttribute("data-prism-preset", "obsidian-dark");
			} else {
				root.classList.remove("dark");
				root.setAttribute("data-prism-preset", "daylight-crystal");
			}
			break;
		}
	}

	// Set the theme for Expressive Code
	document.documentElement.setAttribute(
		"data-theme",
		expressiveCodeConfig.theme,
	);
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}
