import assert from "node:assert/strict";
import test from "node:test";
import { Globe, Instagram, Music2 } from "lucide-react";
import { iconForLink } from "./link-icons.ts";

test("maps known icon enum keys to brand-ish icons", () => {
  assert.equal(iconForLink("INSTAGRAM"), Instagram);
});

test("falls back to Globe for unknown/custom/undefined", () => {
  assert.equal(iconForLink("CUSTOM"), Globe);
  assert.equal(iconForLink(undefined), Globe);
  assert.equal(iconForLink("SOMETHING_NEW"), Globe);
});

test("uses Music2 for music platforms without a lucide brand glyph", () => {
  assert.equal(iconForLink("SPOTIFY"), Music2);
  assert.equal(iconForLink("APPLE_MUSIC"), Music2);
});
