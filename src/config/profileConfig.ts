import type { ProfileConfig } from "../types/profileConfig";
import wallpaperCredits from "@/data/wallpaper-credits.json";

type WallpaperCredit = { avatar: string };
const avatarFromApi = ((wallpaperCredits.items ?? []) as WallpaperCredit[]).map(
	(item) => `/assets/images/avatars/${item.avatar}`,
);

export const profileConfig: ProfileConfig = {
	// 头像
	// 图片路径支持三种格式：
	// 1. public 目录（以 "/" 开头，不优化）："/assets/images/avatar.webp"
	// 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/avatar.webp"
	// 3. 远程 URL："https://example.com/avatar.jpg"
	avatar: "assets/images/avatar.avif",

	// 头像轮换池：每次刷新随机选一张（由 API 生成）
	avatarPool: avatarFromApi.length
		? avatarFromApi
		: [
				"/assets/images/avatars/avatar-1.webp",
				"/assets/images/avatars/avatar-2.webp",
				"/assets/images/avatars/avatar-3.webp",
				"/assets/images/avatars/avatar-4.webp",
				"/assets/images/avatars/avatar-5.webp",
				"/assets/images/avatars/avatar-6.webp",
			],

	// 名字
	name: "或记",

	// 个人签名
	bio: "记录读过的、写过的、想明白的。",

	// 链接配置
	// 已经预装的图标集：fa7-brands，fa7-regular，fa7-solid，material-symbols，simple-icons
	// 访问https://icones.js.org/ 获取图标代码，
	// 如果想使用尚未包含相应的图标集，则需要安装它
	// `pnpm add @iconify-json/<icon-set-name>`
	// showName: true 时显示图标和名称，false 时只显示图标
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/huoji111",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
		{
			name: "Atom",
			icon: "fa7-solid:atom",
			url: "/atom/",
			showName: false,
		},
	],
};
