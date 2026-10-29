# 或记的博客

一个安静的个人博客：记录读过的书、走过的路，以及那些想明白或没想明白的事。

- 站点地址：<https://huoji-blog.pages.dev>（绑定自定义域名后更新）
- 技术栈：Astro + Svelte + Tailwind CSS
- 主题：基于 [Firefly](https://github.com/CuteLeaf/Firefly) 二次定制
- 部署：GitHub + Cloudflare Pages

## 本地开发

需要 Node.js >= 22.23 与 pnpm 11。

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # 构建到 dist/
pnpm preview  # 预览构建结果
```

## 写文章

文章放在 `src/content/posts/`，新增一个 `.md` 文件即可：

```yaml
---
title: 文章标题
published: 2026-10-29T09:00:00+08:00
description: 一句话摘要
tags: [随笔, 生活]
category: 随笔
image: ./images/cover-1.avif
---

正文……
```

封面图放在 `src/content/posts/images/`。分类、标签、归档、RSS 都会自动生成。

## 常用配置

| 想改什么 | 改哪里 |
| --- | --- |
| 站点标题、描述、导航、页面开关 | `src/config/siteConfig.ts` |
| 首页横幅文字、壁纸轮播 | `src/config/backgroundWallpaper.ts` |
| 头像、昵称、签名、社交链接 | `src/config/profileConfig.ts` |
| 导航菜单 | `src/config/navBarConfig.ts` |
| 侧边栏组件 | `src/config/sidebarConfig.ts` |
| 公告 | `src/config/announcementConfig.ts` |
| 评论 | `src/config/commentConfig.ts` |
| 关于页 | `src/content/spec/about.md` |
| 页脚 | `src/config/FooterConfig.html` |

## 部署

见 [docs/DEPLOY.md](docs/DEPLOY.md)。简而言之：推送到 GitHub，在 Cloudflare Pages 里连接仓库，
构建命令 `pnpm build`，输出目录 `dist`。

## 图片说明

首页壁纸、头像与文章封面来自公开的二次元图片接口（t.alcy.cc、nekos.best），
仅用于个人博客展示，版权归原作者所有；如有侵权请联系删除。

## 许可

主题基于 MIT 协议，见 [LICENSE](LICENSE)。文章内容版权归作者所有。