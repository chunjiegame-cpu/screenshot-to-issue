#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { collectGitInfo, createIssueDraft, getImageMetadata } from "../src/index.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

try {
  if (!args.image) {
    throw new Error("Provide a screenshot path.");
  }

  const imagePath = path.resolve(process.cwd(), args.image);
  const metadata = getImageMetadata(imagePath);
  const draft = createIssueDraft({
    metadata,
    imagePath: args.imageUrl ?? (path.relative(process.cwd(), imagePath) || imagePath),
    imageUrl: args.imageUrl,
    title: args.title,
    url: args.url,
    browser: args.browser,
    expected: args.expected,
    actual: args.actual,
    git: args.noGit ? {} : collectGitInfo(process.cwd())
  });

  if (args.output) {
    const outputPath = path.resolve(process.cwd(), args.output);
    fs.writeFileSync(outputPath, draft);
    console.log(`Issue draft written to ${outputPath}`);
  } else {
    process.stdout.write(draft);
  }
} catch (error) {
  console.error(`screenshot-to-issue: ${error.message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {
    image: undefined,
    imageUrl: undefined,
    title: undefined,
    url: undefined,
    browser: undefined,
    expected: undefined,
    actual: undefined,
    output: undefined,
    noGit: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--title") {
      parsed.title = argv[++index];
    } else if (arg === "--url") {
      parsed.url = argv[++index];
    } else if (arg === "--browser") {
      parsed.browser = argv[++index];
    } else if (arg === "--expected") {
      parsed.expected = argv[++index];
    } else if (arg === "--actual") {
      parsed.actual = argv[++index];
    } else if (arg === "--image-url") {
      parsed.imageUrl = argv[++index];
    } else if (arg === "--no-git") {
      parsed.noGit = true;
    } else if (arg === "--out" || arg === "-o") {
      parsed.output = argv[++index];
    } else if (!arg.startsWith("-") && !parsed.image) {
      parsed.image = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage: screenshot-to-issue <screenshot> [options]

Options:
  --title <text>       Issue title
  --url <url>          Affected page or workflow URL
  --browser <text>     Browser or device details
  --expected <text>    Expected behavior
  --actual <text>      Actual behavior
  --image-url <url>    Use an uploaded image URL instead of local path
  --no-git             Skip git branch and commit lookup
  -o, --out <file>     Write issue draft to a file
  -h, --help           Show help
`);
}
