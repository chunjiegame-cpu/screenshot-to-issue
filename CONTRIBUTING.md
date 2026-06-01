# Contributing

Thanks for taking a look at Screenshot to Issue.

## Development

```bash
npm install
npm test
node bin/screenshot-to-issue.js --help
```

## Guidelines

- Avoid native image dependencies unless the benefit is clear.
- Unknown image formats should degrade cleanly.
- Keep generated Markdown readable without requiring GitHub-specific extensions.
- Update the README and help output when CLI behavior changes.
