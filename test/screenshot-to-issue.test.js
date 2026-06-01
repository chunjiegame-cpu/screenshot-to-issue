import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createIssueDraft, formatBytes, getImageMetadata } from "../src/index.js";

test("reads PNG metadata", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "screenshot-to-issue-"));
  const file = path.join(dir, "mobile-overlap.png");
  fs.writeFileSync(file, makePngHeader(390, 844));

  const metadata = getImageMetadata(file);

  assert.equal(metadata.width, 390);
  assert.equal(metadata.height, 844);
  assert.equal(metadata.format, "png");
});

test("creates a GitHub issue draft", () => {
  const draft = createIssueDraft({
    metadata: {
      fileName: "mobile-overlap.png",
      path: "mobile-overlap.png",
      format: "png",
      width: 390,
      height: 844,
      bytes: 2048
    },
    imagePath: "mobile-overlap.png",
    title: "Button overlaps on mobile",
    url: "http://localhost:3000",
    browser: "Chrome mobile emulation",
    expected: "Button should stay below the card.",
    actual: "Button overlaps the card.",
    git: {
      branch: "main",
      commit: "abc123"
    },
    osInfo: "Test OS"
  });

  assert.match(draft, /# Button overlaps on mobile/);
  assert.match(draft, /!\[mobile-overlap\.png]\(mobile-overlap\.png\)/);
  assert.match(draft, /390x844/);
  assert.match(draft, /abc123/);
});

test("formats byte sizes", () => {
  assert.equal(formatBytes(12), "12 B");
  assert.equal(formatBytes(2048), "2.0 KB");
});

test("CLI help renders", () => {
  const bin = fileURLToPath(new URL("../bin/screenshot-to-issue.js", import.meta.url));
  const output = execFileSync(process.execPath, [bin, "--help"], { encoding: "utf8" });

  assert.match(output, /Usage: screenshot-to-issue/);
});

function makePngHeader(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8;
  buffer[25] = 2;
  return buffer;
}
