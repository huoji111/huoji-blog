# 部署到 Cloudflare Pages

本站是纯静态站点，构建产物在 `dist/`。推荐用 **Cloudflare Pages 的 Git 集成**：
推送到 GitHub 后自动构建、自动发布，不用在本地传文件，也不用配置 API Token。

## 一、把代码推到 GitHub

1. 在 GitHub 新建一个仓库，例如 `huoji-blog`，**Public**（私有仓库也能部署，但公开更省事）。
2. 在本地项目目录执行：

   ```bash
   git init
   git add .
   git commit -m "feat: 或记的博客初始版本"
   git branch -M master
   git remote add origin https://github.com/huoji111/huoji-blog.git
   git push -u origin master
   ```

## 二、在 Cloudflare 创建 Pages 项目

1. 打开 <https://dash.cloudflare.com/> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 授权 GitHub，选择 `huoji-blog` 仓库，分支选 `master`。
3. 构建设置：

   | 配置项 | 值 |
   | --- | --- |
   | Framework preset | Astro |
   | Build command | `pnpm build` |
   | Build output directory | `dist` |
   | Root directory | （留空） |

4. 环境变量（Settings → Environment variables，Production 和 Preview 都加）：

   | 变量 | 值 |
   | --- | --- |
   | `NODE_VERSION` | `22.23.0` |
   | `PNPM_VERSION` | `11.22.0` |

5. 点击 **Save and Deploy**。首次构建大约 3–8 分钟，完成后会得到一个
   `https://huoji-blog.pages.dev` 的地址。

## 三、绑定自己的域名

1. Pages 项目 → **Custom domains** → **Set up a custom domain**。
2. 输入域名（例如 `blog.example.com`）或根域名 `example.com`。
3. 如果域名已经托管在同一个 Cloudflare 账号下，DNS 记录会自动添加；
   否则按提示到域名服务商处添加 CNAME，指向 `huoji-blog.pages.dev`。
4. 等待证书签发（通常几分钟），然后访问域名确认。

> 绑定域名后，记得把 `src/config/siteConfig.ts` 里的 `site_url` 改成正式域名，
> 提交后 Cloudflare 会自动重新构建。这个值会影响 canonical、RSS、sitemap 和分享卡片。

## 四、日常更新

```bash
git add .
git commit -m "post: 新文章标题"
git push
```

推送后 Cloudflare 会自动构建并发布，一般 2–5 分钟上线。

## 备选：Cloudflare Workers

仓库里也保留了 `wrangler.jsonc`。如果更想用 Workers 而不是 Pages：

```bash
pnpm build
npx wrangler deploy
```

首次部署会要求登录 Cloudflare（`npx wrangler login`）。静态资源会作为 Workers Assets 提供服务，
自定义域名的绑定方式与 Pages 类似（Workers → 你的 Worker → Settings → Domains & Routes）。

## 常见问题

**构建失败：Node 版本不对**
确认环境变量 `NODE_VERSION=22.23.0`，本项目要求 Node >= 22.23。

**构建失败：pnpm 版本不对**
确认 `PNPM_VERSION=11.22.0`。`package.json` 里声明了 `packageManager`，版本不一致时 pnpm 可能拒绝执行。

**页面样式正常但图片 404**
检查 `src/assets/images/` 下的壁纸命名是否与 `src/config/backgroundWallpaper.ts` 中的路径一致。

**想开启评论**
编辑 `src/config/commentConfig.ts`，把 `type` 改成 `giscus`，并按 <https://giscus.app> 的指引填写
仓库、分类等信息（需要仓库是公开的，并安装 giscus App）。