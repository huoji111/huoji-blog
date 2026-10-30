export type ProfileConfig = {
	avatar?: string;
	/** 头像轮换池，每次刷新随机展示其中一张（public 目录路径） */
	avatarPool?: string[];
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
		showName?: boolean;
	}[];
};
