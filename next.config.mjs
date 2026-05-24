import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const loadLegacyPublicEnv = () => {
  const envPath = resolve(process.cwd(), "src/.env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    if (process.env[key]) continue;

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
};

loadLegacyPublicEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/about-us",
        destination: "https://business.hoizr.com/about",
        permanent: true,
      },
      {
        source: "/why-hoizr",
        destination: "https://business.hoizr.com/how-it-works",
        permanent: true,
      },
      {
        source: "/blogs",
        destination: "https://business.hoizr.com/blog",
        permanent: true,
      },
      {
        source: "/blogs/:path*",
        destination: "https://business.hoizr.com/blog",
        permanent: true,
      },
      {
        source: "/artists-by-type/:path*",
        destination: "/artists",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default nextConfig;
