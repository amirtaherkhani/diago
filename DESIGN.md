# Diago Web Design System

## 1. Product and Surface
Diago uses a restrained engineering-workbench aesthetic: near-black layered surfaces, cool blue structure, mint verification, amber uncertainty, and orange external-provider emphasis. The hero workbench is the signature material—bordered, gridded, dimensional, and evidence-aware—not a generic dashboard card.

## 2. Tokens
| Role | Token | Value |
|---|---|---|
| Page background | `--bg` | `#0b1018` |
| Elevated background | `--bg-elevated` | `#101722` |
| Surface | `--surface` | `#121b27` |
| Strong surface | `--surface-strong` | `#172331` |
| Border | `--line` | `#253345` |
| Strong diagram border | `--line-strong` | `#34465a` |
| Soft border | `--line-soft` | `rgba(137, 164, 190, 0.16)` |
| Verified surface | `--surface-verified` | `#142a28` |
| Verified border | `--line-verified` | `rgba(110, 243, 197, 0.66)` |
| Structural border | `--line-structure` | `rgba(108, 168, 255, 0.34)` |
| Risk border | `--line-risk` | `rgba(255, 127, 159, 0.62)` |
| Primary text | `--text` | `#f5f8fb` |
| Muted text | `--muted` | `#91a2b5` |
| Strong muted text | `--muted-strong` | `#b8c4d0` |
| Verified | `--mint` | `#6ef3c5` |
| Current relationship | `--blue` | `#6ca8ff` |
| Provider | `--orange` | `#ff9d6c` |
| Risk | `--rose` | `#ff7f9f` |
| Assumption | `--yellow` | `#f2d47a` |
| Focus | `--focus` | `#a8e8ff` |
| Selected workbench tab surface | `--workbench-tab-selected-surface` | `#1a2634` |
| Selected workbench tab border | `--workbench-tab-selected-border` | `#2c3b4d` |
| Diagram stage grid | `--diagram-stage-grid` | `rgba(108, 168, 255, 0.025)` |
| Diagram grid line | `--diagram-grid-line` | `rgba(121, 151, 180, 0.045)` |
| Diagram boundary fill | `--diagram-boundary-fill` | `rgba(108, 168, 255, 0.025)` |
| Diagram boundary border | `--diagram-boundary-border` | `rgba(108, 168, 255, 0.28)` |
| Diagram boundary label | `--diagram-boundary-label` | `#6f89a4` |
| Diagram primary label | `--diagram-primary-text` | `#ecf3f9` |
| Diagram metadata | `--diagram-meta-text` | `#8297ab` |
| Diagram edge label | `--diagram-edge-label` | `#93a9bd` |
| Sequence label surface | `--sequence-label-surface` | `#14202d` |
| Sequence lifeline | `--sequence-lifeline` | `#2f4256` |
| Sequence message text | `--sequence-message-text` | `#a9b9c8` |
| Preview lane line | `--preview-lane-line` | `rgba(145, 162, 181, 0.22)` |
| Preview cycle | `--preview-cycle` | `5000ms` |
| Preview enter | `--preview-enter` | `260ms` |
| Preview resolve | `--preview-resolve` | `320ms` |
| Preview trace | `--preview-trace` | `420ms` |
| Preview stagger | `--preview-stagger` | `55ms` |
| Preview easing | `--preview-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Preview lift | `--preview-lift` | `8px` |

## 3. Typography
Use the existing sans stack for prose and labels and the existing mono stack for filenames, tabs, edge labels, evidence, and status. Workbench labels remain sentence case; renderer names use the catalog spellings Architecture, Sequence, Workflow, Dataflow, Lifecycle, Data model, Timeline, and Layers.

## 4. Layout and Responsive Rules
The hero remains two columns above 1050px and stacks at 1050px and below. The workbench tablist is a 4 by 2 equal-width grid above 760px. At 760px and below it becomes a one-line horizontal rail with scroll snap, hidden scrollbar, and no page-level overflow. The active tab is scrolled into the nearest visible position.

## 5. Reusable Primitives and States
- `Workbench`: default, temporarily held, user-paused, auto-playing, reduced-motion.
- `ViewTab`: inactive, active, keyboard-focused, progress-running, progress-paused.
- `DiagramPanel`: hidden, active-entering, settled; Architecture is visible without JavaScript.
- `PlaybackControl`: hidden before enhancement, Pause while auto-play is enabled, Play while explicitly paused.
- `EvidenceLegend`: verified, assumption, current, proposed; always present across renderer views.

## 6. Motion
Panels enter with opacity and an 8px vertical transform using the existing ease-out character. Nodes resolve in reading order at 55ms intervals. Edges trace once after their source nodes. The selected tab carries one 5-second progress line only while the timer is active. Temporary holds stop and restart the cycle; they do not add decorative motion.

## 7. Accessibility Constraints
Use the WAI-ARIA tabs pattern with roving tabindex, `aria-controls`, `aria-labelledby`, Left/Right/Home/End keys, and visible focus. Automatic changes have an adjacent pause control and stop on hover, focus within the workbench, document hiding, or reduced-motion preference. Color never carries evidence meaning alone.

## 8. Accepted Debt and Handoff
The marketing preview uses representative compact SVG rather than loading full renderer output to keep GitHub Pages dependency-free. This is accepted only while every panel remains truthful to a supported renderer and its engineering question. Recheck all eight panels whenever the public renderer catalog changes.
