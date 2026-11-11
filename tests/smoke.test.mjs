import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("manifest is a valid Manifest V3 new-tab extension", async () => {
  const manifest = JSON.parse(await read("manifest.json"));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.chrome_url_overrides.newtab, "newtab.html");
  assert.equal(manifest.background.service_worker, "background.js");
  for (const permission of ["storage", "alarms", "notifications"]) assert.ok(manifest.permissions.includes(permission));
});

test("all manifest and bundled asset paths exist", async () => {
  const manifest = JSON.parse(await read("manifest.json"));
  const required = [manifest.chrome_url_overrides.newtab, manifest.background.service_worker, ...Object.values(manifest.icons), "newtab.css", "newtab.js", "images.js"];
  await Promise.all(required.map((path) => access(new URL(path, root))));
});

test("dashboard exposes every planned feature", async () => {
  const html = await read("newtab.html");
  for (const id of ["clock", "focusInput", "searchForm", "timerToggle", "taskForm", "notesInput", "changeBackground"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
});

test("background catalogue references four bundled SVG scenes", async () => {
  const catalogue = await read("images.js");
  const matches = [...catalogue.matchAll(/url:\s*["']([^"']+\.svg)["']/g)].map((match) => match[1]);
  assert.equal(matches.length, 4);
  await Promise.all(matches.map((path) => access(new URL(path, root))));
});
