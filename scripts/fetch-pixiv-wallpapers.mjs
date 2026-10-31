import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ART = path.join(ROOT, "_assets", "pixiv-art");
const DESKTOP_DIR = path.join(ROOT, "src", "assets", "images", "DesktopWallpaper");
const MOBILE_DIR = path.join(ROOT, "src", "assets", "images", "MobileWallpaper");
const AVATAR_DIR = path.join(ROOT, "public", "assets", "images", "avatars");
const COVER_DIR = path.join(ROOT, "src", "content", "posts", "images");
const DATA_DIR = path.join(ROOT, "src", "data");

const args = process.argv.slice(2);
const SEED = Number(process.env.WALLPAPER_SEED || args.find((a) => a.startsWith("--seed="))?.split("=")[1] || Date.now());
const COUNT = 12;
const UA = "HuojiBlogWallpaperBot/1.0 (personal blog; +https://github.com/huoji111)";
const API = "https://api.lolicon.app/setu/v2";

const BAD =
	/R-18|R18|ロリ|loli|蘿莉|萝莉|おっぱい|欧派|マイクロビキニ|极小比基尼|水着|泳装|ビキニ|swimsuit|魅惑|乳|ふともも|太もも|ぱんつ|パンツ|下着|黒スト|白タイツ|白ストッキング|ストッキング|タイツ|モザイク|mosaic|露出|裸|nude|nsfw|極上|极上|痴女|誘惑|色気|ブルマ|沙滩|ビーチ|海辺/i;
const GAME =
	/原神|Genshin|崩壊|崩坏|星穹|ブルーアーカイブ|ブルアカ|碧蓝档案|アズールレーン|碧蓝航线|鳴潮|鸣潮|ゼンレスゾーンゼロ|绝区零|アークナイツ|明日方舟|Fate|このすば|五等分|SPY|リゼロ|SAO|ソードアート|ブルー|アーク|少女前线|ドルフロ|NIKKE|勝利女神/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shuffle(arr, seed) {
	const a = [...arr];
	let s = seed >>> 0;
	const rnd = () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 2 ** 32;
	};
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rnd() * (i + 1));
		[ a[i], a[j] ] = [ a[j], a[i] ];
	}
	return a;
}

async function fetchJson(url, retries = 3) {
	for (let i = 1; i <= retries; i++) {
		try {
			const res = await fetch(url, {
				headers: { "User-Agent": UA },
				signal: AbortSignal.timeout(60000),
			});
			if (!res.ok) throw new Error("HTTP " + res.status);
			const json = await res.json();
			if (json.error) throw new Error(json.error);
			return json;
		} catch (e) {
			if (i === retries) throw e;
			await sleep(2000 * i);
		}
	}
	throw new Error("unreachable");
}

async function download(url, file) {
	try {
		const st = await fs.stat(file);
		if (st.size > 5000) return file;
	} catch {}
	for (let i = 1; i <= 3; i++) {
		try {
			const res = await fetch(url, {
				headers: { "User-Agent": UA, Referer: "https://www.pixiv.net/" },
				signal: AbortSignal.timeout(120000),
			});
			if (!res.ok) throw new Error("HTTP " + res.status);
			const buf = Buffer.from(await res.arrayBuffer());
			if (buf.length < 5000) throw new Error("too small");
			await fs.mkdir(path.dirname(file), { recursive: true });
			await fs.writeFile(file, buf);
			return file;
		} catch (e) {
			if (i === 3) throw e;
			await sleep(1500 * i);
		}
	}
	throw new Error("unreachable");
}

function pickArt(d) {
	return {
		pid: d.pid,
		author: d.author,
		title: d.title,
		width: d.width,
		height: d.height,
		tags: d.tags,
		url: d.urls.original,
		pageUrl: `https://www.pixiv.net/artworks/${d.pid}`,
	};
}

async function posterDesktop(src, out) {
	const meta = await sharp(src).metadata();
	const W = 2688;
	const H = 1536;
	const ar = meta.width / meta.height;

	if (ar >= 1.4) {
		await sharp(src).resize(W, H, { fit: "cover", position: "attention" }).avif({ quality: 64, effort: 4 }).toFile(out);
		return;
	}

	const bg = await sharp(src).resize(W, H, { fit: "cover" }).blur(52).modulate({ brightness: 0.42, saturation: 0.9 }).toBuffer();
	const fg = await sharp(src).resize({ height: H }).toBuffer();
	const fgMeta = await sharp(fg).metadata();
	const fgW = Math.min(fgMeta.width, Math.round(W * 0.62));
	const fgBuf = fgW < fgMeta.width ? await sharp(fg).resize({ width: fgW }).toBuffer() : fg;
	const left = W - fgW - Math.round(W * 0.03);

	const grad = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
		<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#05070b" stop-opacity="0.88"/>
			<stop offset="0.45" stop-color="#05070b" stop-opacity="0.55"/>
			<stop offset="0.72" stop-color="#05070b" stop-opacity="0.08"/>
			<stop offset="1" stop-color="#05070b" stop-opacity="0"/>
		</linearGradient></defs>
		<rect width="100%" height="100%" fill="url(#g)"/>
	</svg>`);

	const glow = await sharp(fgBuf).blur(60).modulate({ brightness: 0.7 }).png().toBuffer();
	await sharp(bg)
		.composite([
			{ input: grad, left: 0, top: 0 },
			{ input: glow, left: left - 40, top: 0, blend: "screen" },
			{ input: fgBuf, left, top: 0 },
		])
		.avif({ quality: 64, effort: 4 })
		.toFile(out);
}

async function posterMobile(src, out) {
	const meta = await sharp(src).metadata();
	const W = 1536;
	const H = 2304;
	const ar = meta.width / meta.height;
	if (ar <= 0.85) {
		await sharp(src).resize(W, H, { fit: "cover", position: "attention" }).avif({ quality: 64, effort: 4 }).toFile(out);
		return;
	}
	const bg = await sharp(src).resize(W, H, { fit: "cover" }).blur(46).modulate({ brightness: 0.45 }).toBuffer();
	const fg = await sharp(src).resize({ width: W }).toBuffer();
	const fgMeta = await sharp(fg).metadata();
	await sharp(bg)
		.composite([{ input: fg, left: 0, top: Math.round((H - fgMeta.height) / 2) }])
		.avif({ quality: 64, effort: 4 })
		.toFile(out);
}

async function avatar(src, out) {
	const meta = await sharp(src).metadata();
	const side = Math.round(Math.min(meta.width, meta.height) * 0.42);
	const left = Math.round((meta.width - side) / 2);
	const top = Math.round(meta.height * 0.04);
	await sharp(src)
		.extract({ left, top, width: side, height: side })
		.resize(512, 512, { fit: "cover" })
		.webp({ quality: 88 })
		.toFile(out);
}

async function cover(src, out) {
	await sharp(src).resize(1600, 900, { fit: "cover", position: "attention" }).avif({ quality: 64, effort: 4 }).toFile(out);
}

async function main() {
	await Promise.all([
		fs.mkdir(ART, { recursive: true }),
		fs.mkdir(DESKTOP_DIR, { recursive: true }),
		fs.mkdir(MOBILE_DIR, { recursive: true }),
		fs.mkdir(AVATAR_DIR, { recursive: true }),
		fs.mkdir(COVER_DIR, { recursive: true }),
		fs.mkdir(DATA_DIR, { recursive: true }),
	]);

	const works = new Map();
	for (let page = 1; page <= 30; page++) {
		const url = `${API}?r18=0&num=20&page=${page}&excludeAI=true&size=original`;
		const json = await fetchJson(url);
		const data = json.data ?? [];
		for (const d of data) works.set(d.pid, d);
		process.stdout.write(`\rAPI page ${page}: ${works.size} works`);
		await sleep(data.length ? 700 : 200);
	}
	console.log("");

	const safe = [...works.values()].filter((d) => {
		const text = [...d.tags, d.title].join(" ");
		return !BAD.test(text) && d.aiType !== 1 && Math.min(d.width, d.height) >= 1100;
	});

	const preferred = safe.filter((d) => GAME.test([...d.tags, d.title].join(" ")));
	const pool = [...preferred, ...safe.filter((d) => !preferred.includes(d))];
	console.log(`works ${works.size}, safe ${safe.length}, game-related ${preferred.length}`);

	const selected = shuffle(pool, SEED).slice(0, COUNT);
	if (selected.length < 8) throw new Error("not enough candidates: " + selected.length);

	const credits = [];
	const files = new Array(selected.length);
	let cursor = 0;
	let finished = 0;
	async function worker() {
		while (cursor < selected.length) {
			const i = cursor++;
			const d = selected[i];
			const ext = d.ext || "jpg";
			const file = path.join(ART, `${d.pid}.${ext}`);
			try {
				await download(d.urls.original, file);
				files[i] = file;
				finished++;
				console.log(`download ${finished}/${selected.length} ok ${d.pid}`);
			} catch (e) {
				console.log(`download ${d.pid} failed: ${e.message}`);
			}
		}
	}
	await Promise.all([worker(), worker(), worker()]);

	for (let i = 0; i < selected.length; i++) {
		const d = selected[i];
		if (!files[i]) continue;
		const n = i + 1;
		await posterDesktop(files[i], path.join(DESKTOP_DIR, `h${n}.avif`));
		await posterMobile(files[i], path.join(MOBILE_DIR, `p${n}.avif`));
		await avatar(files[i], path.join(AVATAR_DIR, `avatar-${n}.webp`));
		const art = pickArt(d);
		credits.push({
			index: n,
			pid: art.pid,
			title: art.title,
			author: art.author,
			tags: art.tags.slice(0, 8),
			pageUrl: art.pageUrl,
			imageUrl: art.url,
			desktop: `h${n}.avif`,
			mobile: `p${n}.avif`,
			avatar: `avatar-${n}.webp`,
		});
		console.log(`built ${n}/${selected.length} ${d.width}x${d.height} ${d.author}`);
	}

	if (credits.length < 8) throw new Error("generated too few: " + credits.length);
	for (let i = 0; i < 4; i++) {
		await cover(path.join(DESKTOP_DIR, `h${i + 1}.avif`), path.join(COVER_DIR, `cover-${i + 1}.avif`));
	}

	await fs.writeFile(
		path.join(DATA_DIR, "wallpaper-credits.json"),
		JSON.stringify(
			{ seed: SEED, generatedAt: new Date().toISOString(), source: "Lolicon API (Pixiv)", count: credits.length, items: credits },
			null,
			2,
		) + "\n",
	);
	console.log(`\ndone: ${credits.length} wallpapers`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});