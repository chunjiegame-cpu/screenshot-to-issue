# Screenshot to Issue

[![Node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org)
[![CI](https://github.com/chunjiegame-cpu/screenshot-to-issue/actions/workflows/ci.yml/badge.svg)](https://github.com/chunjiegame-cpu/screenshot-to-issue/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Create a GitHub-ready issue draft from a screenshot. The output includes image metadata, environment context, reproduction placeholders, expected and actual behavior, and a triage checklist.

This is meant for the moment after you capture a UI bug and before the details evaporate. It does not upload images or call the GitHub API; it produces clean Markdown that you can paste into an issue, save in a bug folder, or pass to another automation.

## Installation

From source:

```bash
git clone https://github.com/chunjiegame-cpu/screenshot-to-issue.git
cd screenshot-to-issue
npm install
node bin/screenshot-to-issue.js --help
```

As a package after publishing:

```bash
npm install -g screenshot-to-issue
screenshot-to-issue ./bug.png
```

## Usage

```bash
screenshot-to-issue ./bug.png
screenshot-to-issue ./bug.png --title "Button overlaps on mobile"
screenshot-to-issue ./bug.png --url http://localhost:3000 --browser "Chrome, iPhone 14 viewport"
screenshot-to-issue ./bug.png --expected "CTA stays below the card" --actual "CTA overlaps the card"
screenshot-to-issue ./bug.png --image-url https://example.com/bug.png --out issue-draft.md
```

## Sample Output

```markdown
# Button overlaps on mobile

## Summary

The attached screenshot shows a UI or product issue that needs investigation.

## Screenshot

![mobile-overlap.png](mobile-overlap.png)

## Evidence

- File: `mobile-overlap.png`
- Image: png 390x844, 42.8 KB
- Captured context: http://localhost:3000
- Browser/device: Chrome, iPhone 14 viewport
```

## Supported Metadata

| Format | Dimensions |
| --- | --- |
| PNG | Yes |
| JPEG | Yes |
| GIF | Yes |
| WebP VP8X | Yes |

Unknown formats still work; the issue draft just reports dimensions as unknown.

## CLI Reference

| Option | Description |
| --- | --- |
| `--title <text>` | Issue title. Defaults to a title generated from the file name. |
| `--url <url>` | Affected page, route, or workflow. |
| `--browser <text>` | Browser, viewport, device, or test environment. |
| `--expected <text>` | Expected behavior section text. |
| `--actual <text>` | Actual behavior section text. |
| `--image-url <url>` | Reference an uploaded image URL instead of a local relative path. |
| `--no-git` | Skip git branch and commit lookup. |
| `-o, --out <file>` | Write the issue draft to a file. |
| `-h, --help` | Show help. |

## Programmatic API

```js
import { createIssueDraft, getImageMetadata } from "screenshot-to-issue";

const metadata = getImageMetadata("bug.png");
const markdown = createIssueDraft({
  metadata,
  imagePath: "bug.png",
  title: "Button overlaps on mobile"
});
```

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Draft was written or printed successfully. |
| `1` | Arguments were invalid or the screenshot could not be read. |

## Known Limits

- It does not perform OCR or visual analysis.
- It does not upload screenshots to GitHub.
- WebP support currently covers VP8X headers.
- Local paths in Markdown are intended for drafts committed with the screenshot or edited before pasting into GitHub.

## Development

```bash
npm install
npm test
node bin/screenshot-to-issue.js --help
```

Image metadata changes should degrade cleanly for unknown formats and avoid adding native dependencies.

## License

MIT
