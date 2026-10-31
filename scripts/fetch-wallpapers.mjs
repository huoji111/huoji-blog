import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ART = path.join(ROOT, "_assets", "safebooru");
const DESKTOP_DIR = path.join(ROOT, "src", "assets", "images", "DesktopWallpaper");
const MOBILE_DIR = path.join(ROOT, "src", "assets", "images", "MobileWallpaper");
const AVATAR_DIR = path.join(ROOT, "public", "assets", "images", "avatars");
const COVER_DIR = path.join(ROOT, "src", "content", "posts", "images");
const DATA_DIR = path.join(ROOT, "src", "data");
const CACHE = path.join(ROOT, ".cache", "safebooru");

const args = process.argv.slice(2);
const SEED = Number(process.env.WALLPAPER_SEED || args.find((a) => a.startsWith("--seed="))?.split("=")[1] || Date.now());
const COUNT = 12;
const UA = "HuojiBlogWallpaperBot/1.0 (personal blog; +https://github.com/huoji111)";
const API = "https://safebooru.org/index.php";

const BAD =
	/R-18|nude|nsfw|underwear|panties|bikini|swimsuit|lingerie|topless|nipples|loli|child|shota|buruma|bloomers|spread_legs|cleavage|large_breasts|pantyhose|thighhighs|foot_focus|ass_focus|ass|comic|text|watermark|armpits|blood|bandaid/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shuffle(arr, seed) {
	const a = [ ...arr ];
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

async function fetchPosts(tags) {
	const file = path.join(CACHE, `${tags.replace(/\s+/g, "_")}.json`);
	try {
		return JSON.parse(await fs.readFile(file, "utf8"));
	} catch {}
	for (let attempt = 1; attempt <= 4; attempt++) {
		try {
			const url = `${API}?page=dapi&s=post&q=index&json=1&limit=100&tags=${encodeURIComponent(tags)}`;
			const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) });
			if (!res.ok) throw new Error("HTTP " + res.status);
			const json = await res.json();
			if (!Array.isArray(json) || !json.length) throw new Error("empty");
			await fs.mkdir(CACHE, { recursive: true });
			await fs.writeFile(file, JSON.stringify(json));
			return json;
		} catch (e) {
			if (attempt === 4) throw e;
			await sleep(3000 * attempt);
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
				headers: { "User-Agent": UA, Referer: "https://safebooru.org/" },
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

async function makeWide(src, out) {
	await sharp(src).resize(2688, 1536, { fit: "cover", position: "attention" }).avif({ quality: 64, effort: 4 }).toFile(out);
}

async function makeTall(src, out) {
	await sharp(src).resize(1536, 2304, { fit: "cover", position: "attention" }).avif({ quality: 64, effort: 4 }).toFile(out);
}

async function makeAvatar(src, out) {
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

async function makeCover(src, out) {
	await sharp(src).resize(1600, 900, { fit: "cover", position: "attention" }).avif({ quality: 64, effort: 4 }).toFile(out);
}

function sourceHost(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return "未知来源";
	}
}

function pixivId(url) {
	const m = url?.match(/\/(\d{5,})_p\d+\./);
	return m ? Number(m[1]) : null;
}

function toItem(d, index, extra = {}) {
	const pid = pixivId(d.source);
	return {
		index,
		id: d.id,
		width: d.width,
		height: d.height,
		postUrl: `https://safebooru.org/index.php?page=post&s=view&id=${d.id}`,
		sourceUrl: d.source || "",
		imageUrl: d.file_url,
		sourceHost: sourceHost(d.source),
		pixivId: pid,
		pixivUrl: pid ? `https://www.pixiv.net/artworks/${pid}` : "",
		tags: String(d.tags || "")
			.split(" ")
			.filter(Boolean)
			.slice(0, 10),
		...extra,
	};
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

	const [wideRaw, tallRaw] = await Promise.all([
		fetchPosts("1girl landscape solo"),
		fetchPosts("1girl portrait solo"),
	]);

	const keep = (d) => !BAD.test(d.tags || "") && Math.min(d.width, d.height) >= 1000;
	const dedupe = (list) => {
		const seen = new Set();
		return list.filter((d) => {
			const key = d.md5 || `${d.directory}/${d.image}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	};
	const wide = dedupe(
		wideRaw.filter((d) => {
			const ar = d.width / d.height;
			return keep(d) && ar >= 1.5 && ar <= 2.1 && d.width >= 1600;
		}),
	);
	const tall = dedupe(
		tallRaw.filter((d) => {
			const ar = d.width / d.height;
			return keep(d) && ar >= 0.55 && ar <= 0.8 && d.height >= 1700;
		}),
	);
	console.log(`wide candidates ${wide.length}, tall candidates ${tall.length}`);

	const desktopPicks = shuffle(wide, SEED).slice(0, COUNT);
	const mobilePicks = shuffle(tall, SEED + 1).slice(0, COUNT);
	if (desktopPicks.length < 6 || mobilePicks.length < 6) {
		throw new Error(`not enough candidates: wide=${desktopPicks.length} tall=${mobilePicks.length}`);
	}

	const jobs = [
		...desktopPicks.map((d, i) => ({ kind: "desktop", d, i })),
		...mobilePicks.map((d, i) => ({ kind: "mobile", d, i })),
	];
	const files = new Array(jobs.length);
	let cursor = 0;
	let finished = 0;
	async function worker() {
		while (cursor < jobs.length) {
			const idx = cursor++;
			const { kind, d } = jobs[idx];
			const ext = (d.file_url.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || "jpg").toLowerCase();
			const file = path.join(ART, `${kind}-${d.id}.${ext}`);
			try {
				await download(d.file_url, file);
				files[idx] = file;
				finished++;
				console.log(`download ${finished}/${jobs.length} ${kind} ${d.id}`);
			} catch (e) {
				console.log(`download ${kind} ${d.id} failed: ${e.message}`);
			}
		}
	}
	await Promise.all([ worker(), worker(), worker(), worker() ]);

	const result = { seed: SEED, generatedAt: new Date().toISOString(), source: "Safebooru API", desktop: [], mobile: [] };

	for (let i = 0; i < desktopPicks.length; i++) {
		if (!files[i]) continue;
		const d = desktopPicks[i];
		await makeWide(files[i], path.join(DESKTOP_DIR, `h${i + 1}.avif`));
		result.desktop.push(toItem(d, i + 1, { file: `h${i + 1}.avif` }));
		console.log(`wide ${i + 1}/${desktopPicks.length} #${d.id}`);
	}

	for (let i = 0; i < mobilePicks.length; i++) {
		if (!files[desktopPicks.length + i]) continue;
		const d = mobilePicks[i];
		await makeTall(files[desktopPicks.length + i], path.join(MOBILE_DIR, `p${i + 1}.avif`));
		await makeAvatar(files[desktopPicks.length + i], path.join(AVATAR_DIR, `avatar-${i + 1}.webp`));
		result.mobile.push(toItem(d, i + 1, { file: `p${i + 1}.avif`, avatar: `avatar-${i + 1}.webp` }));
		console.log(`tall ${i + 1}/${mobilePicks.length} #${d.id}`);
	}

	for (let i = 0; i < 4; i++) {
		await makeCover(path.join(DESKTOP_DIR, `h${i + 1}.avif`), path.join(COVER_DIR, `cover-${i + 1}.avif`));
	}

	await fs.writeFile(path.join(DATA_DIR, "wallpaper-credits.json"), JSON.stringify(result, null, 2) + "\n");
	console.log(`\ndone: ${result.desktop.length} desktop, ${result.mobile.length} mobile`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});