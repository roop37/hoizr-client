const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const read = (relativePath) =>
  fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");

const queries = read("src/lib/artist-queries.ts");
assert.ok(
  (queries.match(/\bstageName\b/g) ?? []).length >= 2,
  "public artist list and profile queries should request stageName",
);

const types = read("src/types/artist.ts");
assert.ok(
  (types.match(/stageName\?: string \| null/g) ?? []).length >= 2,
  "public artist profile and list item types should expose stageName",
);

const helper = read("src/lib/artist-name.ts");
assert.match(
  helper,
  /artist\.stageName\?\.trim\(\)/,
  "display-name helper should prefer a trimmed stage name",
);

for (const relativePath of [
  "src/app/artist/page.tsx",
  "src/app/artist/[idOrSlug]/page.tsx",
  "src/app/artist/[idOrSlug]/[name]/page.tsx",
  "src/app/artist/[idOrSlug]/ArtistProfile.tsx",
  "src/app/artists/page.tsx",
  "src/components/hoizr-ui/ArtistTile.tsx",
  "src/components/hoizr-ui/DomeGallery.tsx",
  "src/components/hoizr-ui/seo/JsonLd.tsx",
]) {
  const source = read(relativePath);
  assert.ok(
    source.includes("getArtistDisplayName"),
    `${relativePath} should use the shared artist display-name helper`,
  );
}

console.log("artist-stage-name-display.test.js passed");
