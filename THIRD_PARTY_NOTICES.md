# Third-party notices

Diago preserves notices for five MIT-licensed upstream sources, the GitHub Octicons mark, Simple Icons social marks, and the bundled JetBrains Mono font. Pinned upstream versions are recorded in `vendor/upstreams.lock.json`.

## GitHub Octicons

- Source: https://github.com/primer/octicons/blob/main/icons/mark-github-16.svg
- Integration: GitHub mark in the GitHub Pages header
- License: `docs/assets/licenses/octicons-MIT.txt`

## Simple Icons

- Source: https://github.com/simple-icons/simple-icons/tree/98820a4dc8c363ca72fa2c0d294ea4a0a9bba75d/icons
- Integration: X, Hashnode, and DEV marks in the GitHub Pages footers, bundled in `docs/assets/social-icons.svg`
- License: CC0 1.0 Universal, preserved in `docs/assets/licenses/simple-icons-CC0.txt`

## Archify

- Source: https://github.com/tt-a1i/archify
- Pinned source: `main` at `bb990b17b886e83d633e273221615eb259a92c78`
- Integration: bundled runtime, schemas, renderer, templates, and original skill snapshot
- License: `vendor/archify/LICENSE`

Archify's original copyright and MIT license are preserved with the vendored runtime.
The viewer template also bundles JetBrains Mono font subsets under the SIL Open Font License 1.1; its license text is preserved in `vendor/archify/assets/JetBrainsMono-OFL.txt`.

## Architecture Diagram Skill

- Source: https://github.com/konraddzbik/architecture-diagram-skill
- Pinned revision: `486ac078705c873012239124a07e7ef2df8fe783`
- Integration: methodology snapshot used to inform interaction and walkthrough patterns
- License: `vendor/architecture-diagram-skill/LICENSE`

## UI UX Pro Max Skill

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Pinned revision: `1a2c459b35f26116fd165b0a0f30597f252749ff`
- Integration: methodology snapshot used to inform visual quality, accessibility, and design-system guidance
- License: `vendor/ui-ux-pro-max-skill/LICENSE`

## Diagram Design

- Source: https://github.com/cathrynlavery/diagram-design
- Pinned revision: `f4547ee95f88e5b28a52517feff6b6c11cc657f9`
- Integration: minimal methodology snapshot used to inform question-first selection, semantic-pattern separation, and bounded decomposition
- License: `vendor/diagram-design/LICENSE`

The canonical skills in this repository are original integration work. Upstream snapshots remain clearly separated so updates can be reviewed before their ideas are adapted.

## Oh My Mermaid

- Source: https://github.com/oh-my-mermaid/oh-my-mermaid
- Pinned ref and commit: `vendor/upstreams.lock.json` (`oh-my-mermaid`)
- Integration: methodology snapshot of the README and recursive architecture scanning skill
- License: `vendor/oh-my-mermaid/LICENSE` (MIT, copyright 2025 oh-my-mermaid)

The snapshot is review material. Its CLI, browser server, cloud client, and installation skills are not installed or executed by Diago. See [the integration review](docs/upstreams/oh-my-mermaid-review.md).
