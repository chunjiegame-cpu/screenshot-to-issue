import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

export function getImageMetadata(filePath) {
  const buffer = fs.readFileSync(filePath);
  const stat = fs.statSync(filePath);
  const dimensions = readDimensions(buffer);

  return {
    path: filePath,
    fileName: path.basename(filePath),
    extension: path.extname(filePath).toLowerCase().replace(/^\./, ""),
    bytes: stat.size,
    modified: stat.mtime.toISOString(),
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    format: dimensions?.format ?? inferFormat(filePath)
  };
}

export function createIssueDraft(input) {
  const metadata = input.metadata;
  const title = input.title ?? titleFromFile(metadata.fileName);
  const imagePath = input.imageUrl ?? input.imagePath ?? metadata.path;
  const dimensionText = metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : "unknown dimensions";
  const sizeText = formatBytes(metadata.bytes);
  const git = input.git ?? {};
  const osInfo = input.osInfo ?? `${os.type()} ${os.release()} (${os.platform()} ${os.arch()})`;

  return `# ${title}

## Summary

The attached screenshot shows a UI or product issue that needs investigation.

## Screenshot

![${metadata.fileName}](${toMarkdownPath(imagePath)})

## Evidence

- File: \`${metadata.fileName}\`
- Image: ${metadata.format ?? "unknown"} ${dimensionText}, ${sizeText}
- Captured context: ${input.url ?? "not provided"}
- Browser/device: ${input.browser ?? "not provided"}
- OS: ${osInfo}
- Git branch: ${git.branch ?? "not available"}
- Git commit: ${git.commit ?? "not available"}

## Reproduction Steps

1. Open ${input.url ?? "the affected page or workflow"}.
2. Perform the action shown in the screenshot.
3. Compare the actual result with the expected behavior below.

## Expected Behavior

${input.expected ?? "Describe what should have happened."}

## Actual Behavior

${input.actual ?? "Describe what the screenshot shows."}

## Triage Checklist

- [ ] Reproduced locally
- [ ] Checked recent changes
- [ ] Added viewport, browser, or device details
- [ ] Added logs or console errors if available
`;
}

export function collectGitInfo(cwd = process.cwd()) {
  return {
    branch: runGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd),
    commit: runGit(["rev-parse", "--short", "HEAD"], cwd)
  };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readDimensions(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return {
      format: "png",
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  if (buffer.length >= 10 && buffer.toString("ascii", 0, 3) === "GIF") {
    return {
      format: "gif",
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8)
    };
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return readJpegDimensions(buffer);
  }

  if (buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return readWebpDimensions(buffer);
  }

  return null;
}

function readJpegDimensions(buffer) {
  let offset = 2;

  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      return null;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (length < 2 || offset + 2 + length > buffer.length) {
      return null;
    }

    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (offset + 9 > buffer.length) {
        return null;
      }

      return {
        format: "jpeg",
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + length;
  }

  return null;
}

function readWebpDimensions(buffer) {
  const chunk = buffer.toString("ascii", 12, 16);

  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      format: "webp",
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }

  return null;
}

function inferFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase().replace(/^\./, "");
  return ext || null;
}

function titleFromFile(fileName) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Bug report from screenshot";
}

function toMarkdownPath(value) {
  return String(value).replace(/\\/g, "/").replace(/\)/g, "%29").replace(/\s/g, "%20");
}

function runGit(args, cwd) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}
