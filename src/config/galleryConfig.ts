import type { GalleryConfig } from "@/types/galleryConfig";

// 相册配置
export const galleryConfig: GalleryConfig = {
	// 相册列表
	albums: [
		{
			id: "site-wallpapers",
			name: "网站壁纸",
			description:
				"本站收录的二次元二游风格 2D 插画，参考原神、崩坏：星穹铁道等游戏的官方立绘质感，正常穿着，均注明作品页与原始出处。",
			location: "Safebooru",
			date: "2026-11-01",
			tags: ["壁纸", "插画"],
			cover: "/gallery/site-wallpapers/desktop-01.avif",
		},
	],

	// 瀑布流最小列宽(px)，浏览器根据容器宽度自动计算列数，默认 240
	// 值越小列数越多，值越大列数越少
	columnWidth: 240,
};
