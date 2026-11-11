import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "生的博客",
	subtitle: "长风破浪会有时，直挂云帆济沧海",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true,
		src: "assets/images/banner.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
	],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "相册",
			url: "/pictures/",
		},
		{
			name: "音乐",
			url: "/music/",
		},
		LinkPreset.About,
		{
			name: "GitHub",
			url: "https://github.com/ohhh2020", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const musicConfig = {
	enable: true,
	// 主歌单 ID (用户的 6000+ 首红心曲库)
	neteasePlaylistId: "2971528746",
	server: "netease",
	// 分类歌单列表 (支持随时扩充添加你的其他分类歌单)
	categories: [
		{
			name: "全部曲库 (6000+)",
			id: "2971528746",
			desc: "六千余首庞大音乐宇宙，开启随机漫步",
		},
		{
			name: "专注学习 / 纯音",
			id: "2829883282",
			desc: "适合沉浸编程、思考与阅读的氛围器乐",
		},
		{
			name: "摇滚 / 动力",
			id: "26467411",
			desc: "充满节奏感与活力的燃向曲目",
		},
		{
			name: "华语精选",
			id: "3778678",
			desc: "经典耐听的旋律随笔",
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "生",
	bio: "此网站为更换电脑后的第三版。长风破浪会有时，直挂云帆济沧海。",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/ohhh2020",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
