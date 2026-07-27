# Contributing

Contributions are welcome for diagram recipes, evidence rules, renderer integration, accessibility, examples, and agent compatibility.

## Development

```bash
npm install --ignore-scripts
npm run check
node bin/diago.mjs advise "trace an async job lifecycle"
```

Use Node.js 18 or newer. The project has no runtime npm dependencies.

## Diagram changes

Keep each view focused on one engineering question. Include a source for verified claims, label assumptions, and keep recommendations visually distinct from current behavior. Validate source JSON and inspect standalone HTML at mobile and desktop widths.

## Upstream changes

Do not merge upstream changes blindly. Use `scripts/sync-upstreams.sh <source>`, review license and behavior changes, adapt useful methodology into the canonical skills, and run the full checks.
