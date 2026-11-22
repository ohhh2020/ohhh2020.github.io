<script lang="ts">
import { onMount } from "svelte";

interface PresetOption {
	id: string;
	name: string;
	sub: string;
	isDark: boolean;
	bg: string;
	card: string;
	accent: string;
	border: string;
}

const PRESETS: PresetOption[] = [
	{
		id: "obsidian-dark",
		name: "深空黑曜",
		sub: "冷调钛黑 · 旗舰暗色",
		isDark: true,
		bg: "#0E0E11",
		card: "#141418",
		accent: "#669DF6",
		border: "rgba(255,255,255,0.12)",
	},
	{
		id: "warm-dark",
		name: "暖炭玄岩",
		sub: "玄武岩炭 · 夜间柔和",
		isDark: true,
		bg: "#141413",
		card: "#1B1A18",
		accent: "#D97757",
		border: "rgba(245,240,230,0.12)",
	},
	{
		id: "daylight-crystal",
		name: "白昼冷晶",
		sub: "高明度冰蓝 · 现代明色",
		isDark: false,
		bg: "#F4F7FB",
		card: "#FFFFFF",
		accent: "#2563EB",
		border: "rgba(15,23,42,0.12)",
	},
	{
		id: "warm-alabaster",
		name: "暖白画册",
		sub: "纸墨暖白 · 印刷品书卷",
		isDark: false,
		bg: "#F6F4EE",
		card: "#FFFFFF",
		accent: "#C25934",
		border: "rgba(42,32,20,0.12)",
	},
	{
		id: "classic-dark",
		name: "极简纯黑",
		sub: "经典极简原皮 · 极速长文无卡顿",
		isDark: true,
		bg: "#0A0A0C",
		card: "#121316",
		accent: "#4C8DF6",
		border: "rgba(255,255,255,0.08)",
	},
	{
		id: "classic-light",
		name: "极简纯白",
		sub: "经典极简原皮 · 护眼极速看长文",
		isDark: false,
		bg: "#F9FAFB",
		card: "#FFFFFF",
		accent: "#2563EB",
		border: "rgba(0,0,0,0.08)",
	},
];

let currentPreset = "obsidian-dark";
let isAuto = false;
let isPanelOpen = false;

onMount(() => {
	const storedAuto = localStorage.getItem("prism-auto") === "true";
	const storedPreset = localStorage.getItem("prism-preset") || "obsidian-dark";

	isAuto = storedAuto;
	if (isAuto) {
		const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const targetPreset = isSystemDark ? "obsidian-dark" : "daylight-crystal";
		applyPreset(targetPreset, true);
	} else {
		applyPreset(storedPreset, false);
	}

	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	const handleMediaChange = (e: MediaQueryListEvent) => {
		if (isAuto) {
			const targetPreset = e.matches ? "obsidian-dark" : "daylight-crystal";
			applyPreset(targetPreset, true);
		}
	};
	mediaQuery.addEventListener("change", handleMediaChange);

	const handleOutsideClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (!target.closest("#prism-switch-wrapper")) {
			isPanelOpen = false;
		}
	};
	document.addEventListener("click", handleOutsideClick);

	return () => {
		mediaQuery.removeEventListener("change", handleMediaChange);
		document.removeEventListener("click", handleOutsideClick);
	};
});

function applyPreset(presetId: string, auto = false) {
	const target = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
	currentPreset = target.id;
	isAuto = auto;

	const root = document.documentElement;
	root.setAttribute("data-prism-preset", target.id);

	if (target.isDark) {
		root.classList.add("dark");
		localStorage.setItem("theme", "dark");
	} else {
		root.classList.remove("dark");
		localStorage.setItem("theme", "light");
	}

	localStorage.setItem("prism-preset", target.id);
	if (auto) {
		localStorage.setItem("prism-auto", "true");
	} else {
		localStorage.removeItem("prism-auto");
	}

	// Dispatch custom event for synchronized components (e.g. mobile drawer)
	window.dispatchEvent(
		new CustomEvent("prism-preset-change", {
			detail: { preset: target.id, isAuto: auto },
		})
	);
}

function selectPreset(presetId: string) {
	applyPreset(presetId, false);
	isPanelOpen = false;
}

function toggleAutoMode() {
	if (isAuto) {
		// Disable auto, keep current preset
		isAuto = false;
		localStorage.removeItem("prism-auto");
	} else {
		// Enable auto
		isAuto = true;
		const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const targetPreset = isSystemDark ? "obsidian-dark" : "daylight-crystal";
		applyPreset(targetPreset, true);
	}
}

function togglePanel(e: MouseEvent) {
	e.stopPropagation();
	isPanelOpen = !isPanelOpen;
}

$: activePresetInfo = PRESETS.find((p) => p.id === currentPreset) || PRESETS[0];
</script>

<div id="prism-switch-wrapper" class="relative z-50">
    <!-- Navbar Trigger Button with Gemini Quad-Star & Active Indicator -->
    <button
        aria-label="切换黑曜棱镜光学主题"
        title="黑曜棱镜预设: {activePresetInfo.name}"
        class="relative wb-pill-btn !p-0 rounded-full h-9 w-9 flex items-center justify-center active:scale-90 border border-[var(--card-border)] bg-black/[0.035] dark:bg-white/[0.045] transition-all"
        onclick={togglePanel}
    >
        <!-- Gemini 4-Point Prism Star -->
        <svg class="w-4 h-4 transition-transform duration-300 hover:rotate-45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 1.5C12.25 1.5 12.47 1.67 12.53 1.91C12.74 2.7 13.01 3.47 13.33 4.22C14.56 7.08 16.72 9.24 19.58 10.47C20.33 10.79 21.1 11.06 21.89 11.27C22.13 11.33 22.3 11.55 22.3 11.8C22.3 12.05 22.13 12.27 21.89 12.33C21.1 12.54 20.33 12.81 19.58 13.13C16.72 14.36 14.56 16.52 13.33 19.38C13.01 20.13 12.74 20.9 12.53 21.69C12.47 21.93 12.25 22.1 12 22.1C11.75 22.1 11.53 21.93 11.47 21.69C11.26 20.9 10.99 20.13 10.67 19.38C9.44 16.52 7.28 14.36 4.42 13.13C3.67 12.81 2.9 12.54 2.11 12.33C1.87 12.27 1.7 12.05 1.7 11.8C1.7 11.55 1.87 11.33 2.11 11.27C2.9 11.06 3.67 10.79 4.42 10.47C7.28 9.24 9.44 7.08 10.67 4.22C10.99 3.47 11.26 2.7 11.47 1.91C11.53 1.67 11.75 1.5 12 1.5Z"
                fill="currentColor"
                opacity="0.9"
            />
        </svg>

        <!-- Active Optical Dot Indicator -->
        <span
            class="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full transition-all duration-300 shadow-sm"
            style="background-color: {activePresetInfo.accent}; box-shadow: 0 0 6px {activePresetInfo.accent};"
        ></span>
    </button>

    <!-- Float Panel Dropdown -->
    <div
        id="prism-theme-panel"
        class="absolute right-0 top-12 pt-2 transition-all duration-200"
        class:opacity-0={!isPanelOpen}
        class:pointer-events-none={!isPanelOpen}
        class:-translate-y-2={!isPanelOpen}
    >
        <div class="card-base ag-prism-rim float-panel !top-0 p-3 w-72 shadow-2xl border border-[var(--card-border)]">
            <!-- Header -->
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-[var(--line-divider)]">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" style="background: linear-gradient(135deg, #4c8df6, #9b72cb, #ea4335, #f2b84b);"></span>
                    <span class="font-bold text-xs tracking-wide text-90 uppercase">黑曜棱镜 · 光学预设</span>
                </div>
                <span class="text-[10px] text-50 px-1.5 py-0.5 rounded bg-[var(--btn-regular-bg)]">6-Preset</span>
            </div>

            <!-- 4 Flagship Presets List -->
            <div class="flex flex-col gap-1.5">
                {#each PRESETS as preset}
                    <button
                        type="button"
                        class="flex items-center justify-between w-full p-2 rounded-lg text-left transition-all duration-150 group"
                        class:bg-[var(--btn-plain-bg-active)]={currentPreset === preset.id}
                        class:hover:bg-[var(--btn-plain-bg-hover)]={currentPreset !== preset.id}
                        onclick={() => selectPreset(preset.id)}
                    >
                        <!-- Color Swatch & Title -->
                        <div class="flex items-center gap-3">
                            <!-- Mini Swatch -->
                            <div
                                class="w-7 h-7 rounded-md flex items-center justify-center relative overflow-hidden border shadow-inner flex-shrink-0"
                                style="background-color: {preset.bg}; border-color: {preset.border};"
                            >
                                <div class="w-3.5 h-3.5 rounded-sm shadow-sm" style="background-color: {preset.card}; border: 1px solid {preset.border};"></div>
                                <div class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style="background-color: {preset.accent};"></div>
                            </div>

                            <div class="flex flex-col">
                                <span class="text-sm font-semibold text-90 group-hover:text-[var(--primary)] transition-colors">
                                    {preset.name}
                                </span>
                                <span class="text-[11px] text-50 line-clamp-1">
                                    {preset.sub}
                                </span>
                            </div>
                        </div>

                        <!-- Checkmark Indicator -->
                        {#if currentPreset === preset.id}
                            <span class="text-xs font-bold text-[var(--primary)] px-2 py-0.5 rounded-full bg-[var(--primary-soft)]">
                                当前
                            </span>
                        {/if}
                    </button>
                {/each}
            </div>

            <!-- Divider -->
            <div class="my-2 border-t border-[var(--line-divider)]"></div>

            <!-- Auto Mode Option -->
            <button
                type="button"
                class="flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs font-medium text-75 hover:bg-[var(--btn-plain-bg-hover)] active:scale-98 transition-all"
                onclick={toggleAutoMode}
            >
                <div class="flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="4"></circle>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="m4.93 4.93 1.41 1.41"></path>
                        <path d="m17.66 17.66 1.41 1.41"></path>
                        <path d="M2 12h2"></path>
                        <path d="M20 12h2"></path>
                        <path d="m6.34 17.66-1.41 1.41"></path>
                        <path d="m19.07 4.93-1.41 1.41"></path>
                    </svg>
                    <span>跟随系统自动切换 (Auto)</span>
                </div>
                <div
                    class="w-8 h-4 rounded-full transition-colors p-0.5 flex items-center {isAuto ? 'bg-[var(--primary)]' : 'bg-black/15 dark:bg-white/20'}"
                >
                    <div
                        class="w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm {isAuto ? 'translate-x-4' : 'translate-x-0'}"
                    ></div>
                </div>
            </button>
        </div>
    </div>
</div>
