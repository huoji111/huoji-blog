import type { MusicPlayerConfig } from "../types/musicConfig";
import bilibiliPlaylist from "../data/bilibiliPlaylist.json";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 是否在导航栏显示音乐播放器入口
	showInNavbar: true,

	// 是否在侧边栏显示音乐播放器组件
	showInSidebar: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "local",

	// 默认音量 (0-1)
	volume: 0.45,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "list",

	// 是否启用歌词
	showLyrics: true,

	// 本地音乐配置
	// 音频与封面来自 B 站收藏「音乐」，已提取音轨并放到 public/music 下
	local: {
		playlist: bilibiliPlaylist,
	},
};