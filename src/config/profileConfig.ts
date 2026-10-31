import type { ProfileConfig } from "../types/profileConfig";

export const profileConfig: ProfileConfig = {
	// 固定头像（不轮换）
	avatar: "/assets/images/avatar-fixed.webp",

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
	],
};
