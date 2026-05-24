#!/usr/bin/env node
/**
 * Walks /public for raster images, generates a blurhash + a tiny
 * base64-PNG placeholder for each, and writes:
 *
 *   public/blurhash-manifest.json
 *
 * Consumed by components/marketing/visuals/BlurImage.tsx via the
 * manifest. Re-run whenever images are added/updated:
 *
 *   node scripts/generate-blurhashes.mjs
 *
 * Or wire it into `predev` / `prebuild` in package.json. Generation
 * is fast (~20ms per image on M-series Macs) and the manifest is a
 * stable diff on disk, safe to commit.
 */
import { mkdirSync, readdirSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { extname, join, posix, relative, sep } from "node:path";
import { encode as encodeBlurhash } from "blurhash";
import sharp from "sharp";

const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname;
const MANIFEST_PATH = join(PUBLIC_DIR, "blurhash-manifest.json");
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const SKIP_DIRS = new Set(["fonts", "favicon", ".DS_Store"]);

const walk = (dir, acc = []) => {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (EXTS.has(extname(entry).toLowerCase())) acc.push(full);
  }
  return acc;
};

const toPublicHref = (abs) =>
  "/" + relative(PUBLIC_DIR, abs).split(sep).join(posix.sep);

const generateOne = async (absPath) => {
  const image = sharp(absPath, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) return null;

  // Downsample for blurhash encode (max 64px on the long edge keeps
  // it cheap and the hash still encodes the dominant tones).
  const longEdge = 64;
  const w = width >= height ? longEdge : Math.max(1, Math.round((width / height) * longEdge));
  const h = height > width ? longEdge : Math.max(1, Math.round((height / width) * longEdge));

  const { data, info } = await image
    .clone()
    .resize(w, h, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hash = encodeBlurhash(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,
    4,
  );

  // Tiny base64 PNG placeholder for next/image `blurDataURL`. 24px on
  // the long edge keeps the data URL under 1KB.
  const tinyEdge = 24;
  const tw = width >= height ? tinyEdge : Math.max(1, Math.round((width / height) * tinyEdge));
  const th = height > width ? tinyEdge : Math.max(1, Math.round((height / width) * tinyEdge));
  const tinyBuf = await sharp(absPath, { failOn: "none" })
    .resize(tw, th, { fit: "inside" })
    .blur(2)
    .png({ quality: 50, compressionLevel: 9 })
    .toBuffer();
  const dataURL = `data:image/png;base64,${tinyBuf.toString("base64")}`;

  return {
    src: toPublicHref(absPath),
    hash,
    dataURL,
    width,
    height,
  };
};

const main = async () => {
  const files = walk(PUBLIC_DIR).filter((f) => !f.endsWith("blurhash-manifest.json"));
  process.stdout.write(`Generating blurhashes for ${files.length} images...\n`);

  /** @type {Record<string, { hash: string; dataURL: string; width: number; height: number }>} */
  const manifest = {};

  // Load existing manifest so we can skip unchanged files by mtime.
  let prev = {};
  try {
    prev = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    prev = {};
  }

  let regenerated = 0;
  for (const abs of files) {
    const href = toPublicHref(abs);
    const existing = prev[href];
    const mtime = statSync(abs).mtimeMs;
    if (existing && existing.mtime === mtime) {
      manifest[href] = existing;
      continue;
    }
    try {
      const result = await generateOne(abs);
      if (!result) continue;
      manifest[href] = {
        hash: result.hash,
        dataURL: result.dataURL,
        width: result.width,
        height: result.height,
        mtime,
      };
      regenerated += 1;
      if (regenerated % 10 === 0) {
        process.stdout.write(`  ${regenerated} processed\n`);
      }
    } catch (err) {
      console.error(`  ✗ ${href}:`, err.message);
    }
  }

  mkdirSync(PUBLIC_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  process.stdout.write(
    `Wrote ${MANIFEST_PATH}\n` +
      `  total entries: ${Object.keys(manifest).length}\n` +
      `  regenerated:   ${regenerated}\n`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
