<p align="center">
  <a href="https://amirtaherkhani.github.io/diago/">
    <img src="./docs/assets/banner.png" alt="Diago — Make the system visible before you change it." width="100%">
  </a>
</p>

<h1 align="center">Engineering diagrams, grounded in your code.</h1>

<p align="center">
  Turn a feature, code path, or architecture conversation into an interactive diagram.<br>
  Built for <strong>Codex</strong> and <strong>Claude Code</strong>. Powered by evidence, native MCP tools, and deterministic renderers.
</p>

<p align="center">
  <a href="https://github.com/amirtaherkhani/diago/actions/workflows/ci.yml"><img alt="CI status" src="https://github.com/amirtaherkhani/diago/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/amirtaherkhani/diago/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/amirtaherkhani/diago?style=flat&color=ffbe0b&labelColor=080f20"></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-ffbe0b?labelColor=080f20"></a>
  <a href="./package.json"><img alt="Node.js 18 or newer" src="https://img.shields.io/badge/Node.js-18%2B-ffbe0b?labelColor=080f20"></a>
  <a href="https://github.com/amirtaherkhani/diago/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/amirtaherkhani/diago?style=flat&color=ffbe0b&labelColor=080f20"></a>
</p>

<p align="center">
  <a href="https://amirtaherkhani.github.io/diago/"><strong>Live demo ↗</strong></a> ·
  <a href="#install">Quick start</a> ·
  <a href="#what-you-can-build">Examples</a> ·
  <a href="./docs/USAGE.md">Usage guide</a> ·
  <a href="#contributing">Contribute</a>
</p>

---

## From a question to a shared understanding

**Diago helps engineers explain a system before changing it.** Point your agent at a repository, an engineering task, or a conversation. Diago selects a useful view, records the supporting evidence, and produces a standalone HTML diagram you can open locally and share for review.

| Ground it | Keep it focused | Make it usable |
| :--- | :--- | :--- |
| Trace important claims to code, contracts, or runtime evidence. Label assumptions and proposed changes. | Choose from eight diagram types. Split oversized systems into overview and detail views. | Validate the JSON source and render interactive HTML with responsive layouts, keyboard controls, and reduced-motion support. |

**8 diagram types · 7 MCP tools · 4 agent skills · No runtime npm dependencies**

> [!TIP]
> [Explore all eight views in the live demo](https://amirtaherkhani.github.io/diago/#top). Use the tabs to switch diagrams and the pause control to inspect one at your own pace.

## Install

Requires **Node.js 18+**. Choose the agent you use.

### Codex

```bash
codex plugin marketplace add amirtaherkhani/diago
codex plugin add diago@diago
```

Open a new thread in the repository you want to understand, then ask:

```text
Use $diago-engineering-diagram to map this feature from its API entry point
through the service layer to persistence. Inspect the code, label assumptions,
and render an architecture view and a sequence view.
```

### Claude Code

Run inside Claude Code:

```text
/plugin marketplace add amirtaherkhani/diago
/plugin install diago@diago
/reload-plugins
```

Then ask:

```text
/diago:diago-engineering-diagram
Map this feature from its API entry point to persistence. Inspect the code,
label assumptions, and render architecture and sequence views.
```

Both plugins start the bundled `engineering-diagrams` MCP server automatically. Diago needs no separate API key or hosted service; your agent's own access requirements still apply.

<details>
<summary><strong>Prefer the CLI? Render an example locally.</strong></summary>

```bash
git clone https://github.com/amirtaherkhani/diago.git
cd diago
node bin/diago.mjs doctor
node bin/diago.mjs render architecture examples/plugin-request.architecture.json diagram.html --quality showcase
```

Open `diagram.html` in your browser. The CLI validates and renders existing JSON; your agent authors the diagram source from your evidence.

```bash
node bin/diago.mjs types --json
node bin/diago.mjs advise "trace an idempotent checkout API request"
node bin/diago.mjs plan "trace an idempotent checkout API request" --out checkout.plan.json
node bin/diago.mjs review examples/checkout-feature.diagram-plan.json
```

For direct MCP registration without the plugin, see the [Codex and Claude setup guide](./docs/USAGE.md#connect-the-mcp-server-directly-to-codex).

</details>

## What you can build

| View | The question it answers | Try it |
| :--- | :--- | :--- |
| **Architecture** | What exists, and what depends on it? | [Plugin request source](./examples/plugin-request.architecture.json) |
| **Sequence** | What happens in what order? | [Live preview](https://amirtaherkhani.github.io/diago/#top) → Sequence |
| **Workflow** | Which steps and decisions control the outcome? | [Live preview](https://amirtaherkhani.github.io/diago/#top) → Workflow |
| **Dataflow** | Where does data originate, transform, and land? | [Live preview](https://amirtaherkhani.github.io/diago/#top) → Dataflow |
| **Lifecycle** | How does an entity change state? | [Live preview](https://amirtaherkhani.github.io/diago/#top) → Lifecycle |
| **Data model** | Which entities, keys, and relationships define the domain? | [Order domain source](./examples/order-domain.data-model.json) |
| **Timeline** | How do engineering phases and milestones relate? | [Migration source](./examples/payment-migration.timeline.json) |
| **Layers** | Where are responsibilities and controls enforced? | [Checkout controls source](./examples/checkout-controls.layers.json) |

Each renderer has profiles and complexity limits. Diago records what was merged, collapsed, or omitted so readers can see the scope of the view.

## Use after installation

### Prompts worth trying

**Understand a feature**

```text
Use $diago-engineering-diagram to trace checkout from API entry to payment
and persistence. Show ownership, trust boundaries, and failure paths.
```

**Turn a discussion into architecture**

```text
Use $diago-chat-architecture to visualize the architecture in this conversation.
Show components, responsibilities, and directed relationships. Separate
accepted decisions from proposals, assumptions, and unresolved questions.
```

**Review before you ship**

```text
Use $diago-review-diagram to audit this diagram against the repository.
List unsupported claims, missing boundaries, and ambiguous relationships.
```

In Claude Code, replace `$diago-engineering-diagram` with `/diago:diago-engineering-diagram`, and use the same namespace for the other skills. [See the full prompt library →](./docs/USAGE.md#example-prompts)

### Get a better diagram

1. **Name the decision.** “Explain retry ownership in checkout” gives a clearer scope than “diagram the whole repo.”
2. **Point to evidence.** Supply the entry point, relevant folders, API contract, logs, or selected conversation.
3. **Name the reader.** Ask for an overview for reviewers or a detailed trace for implementers.
4. **Separate now from next.** Require current behavior, proposed changes, and assumptions to stay distinct.
5. **Review the source.** Keep the JSON and HTML together, check unsupported claims, and split crowded views.

## How it works

```text
Question + source evidence
           ↓
      Diagram plan       scope, audience, facts, assumptions
           ↓
      Diagram JSON       selected renderer and bounded detail
           ↓
   Validate → Render     interactive standalone HTML
           ↓
      Review findings → refine the source
```

Diago's core is deterministic. The agent inspects sources and authors a plan; the CLI and MCP tools review, validate, and render it. Schema-v2 plans track selection rationale, evidence lanes, complexity, and fidelity. Legacy v1 plans remain reviewable. [Explore the plan contract →](./docs/USAGE.md#how-it-works)

<details>
<summary><strong>Native MCP tools and included skills</strong></summary>

### Native MCP tools

| Tool | Purpose |
| :--- | :--- |
| `list_diagram_types` | Discover renderers, profiles, patterns, and budgets |
| `advise_diagram` | Select a useful view for a task |
| `create_diagram_plan` | Establish scope, evidence, and the reader's question |
| `plan_evidence_workflow` | Identify ready evidence work and surface failures, retry limits, and claim conflicts |
| `review_diagram_plan` | Find unsupported claims and missing context |
| `validate_diagram` | Check schema, renderer, accessibility, and composition rules |
| `render_diagram` | Write validated standalone HTML to an absolute local path |

Only `render_diagram` writes an artifact. The server uses local stdio transport.

### Included skills

| Skill | Use it to |
| :--- | :--- |
| `diago-engineering-diagram` | Inspect evidence, choose a view, author JSON, and render |
| `diago-chat-architecture` | Extract connected architecture from a conversation |
| `diago-review-diagram` | Audit evidence, boundaries, clarity, and visual quality |
| `diago-update-upstreams` | Check every pinned source and integrate reviewed updates |

</details>

## Evidence workflows

**Available on `main`; not included in the published v0.6.0 plugin.** Run the command below from an updated source checkout. See the [draft v0.7.0 notes](./docs/releases/v0.7.0.md).

Use `diago evidence` or the read-only `plan_evidence_workflow` MCP tool when a diagram needs evidence from independent sources and dependent cross-checks:

```bash
node bin/diago.mjs evidence examples/checkout.evidence-workflow.json --json
```

The planner returns up to the configured number of ready tasks. The host inspects sources, records attempts and verification verdicts in the JSON snapshot, then evaluates it again. Failed branches retain their errors while independent work continues; only explicit retryable failures and timeouts get another attempt. Conflicting claims stay out of the plan's facts.

See [the workflow guide](./docs/evidence-workflows.md) for the snapshot contract, concurrency and timeout handling, evidence reconciliation, and a complete example. Source inspection and verification are performed by the host: Diago neither launches workers nor independently proves the reported claims.

## Contributing

**A useful first contribution can be one small, well-explained example.** Fork the project, choose a focused change, and open a pull request with the engineering question it solves.

| Start here | What to include |
| :--- | :--- |
| Add a diagram example | Source JSON, the reader's question, and evidence references |
| Improve a recipe or prompt | A concrete before/after example and expected result |
| Fix accessibility or layout | Reproduction steps, viewport size, and screenshots |
| Improve agent compatibility | Agent/version, sanitized input, and observed behavior |

```bash
# Clone your fork, then create a focused branch.
git clone https://github.com/YOUR-USERNAME/diago.git
cd diago
git switch -c docs/add-diagram-example
npm install --ignore-scripts
npm run check
```

Read the [contribution guide](./CONTRIBUTING.md), [browse issues](https://github.com/amirtaherkhani/diago/issues), or [propose a use case](https://github.com/amirtaherkhani/diago/issues/new?template=feature_request.yml). Remove secrets and private repository details from shared examples.

### Help more engineers find Diago

- **Star the repository** if it is useful to your work. It helps others discover the project.
- **Fork it for your workflow** and contribute useful recipes or examples back.
- **Share a diagram** with the question it answered and a link to Diago, so others can reproduce the approach.
- **Report what was confusing** in setup or output. A small, reproducible issue is a useful contribution.

<p align="center">
  <a href="https://github.com/amirtaherkhani/diago"><strong>☆ Star Diago</strong></a> ·
  <a href="https://github.com/amirtaherkhani/diago/fork"><strong>Fork the project ↗</strong></a> ·
  <a href="https://github.com/amirtaherkhani/diago/issues/new?template=bug_report.yml">Report an issue</a>
</p>

## Development & reference

| Resource | Contents |
| :--- | :--- |
| [Usage guide](./docs/USAGE.md) | MCP setup, prompt library, plan schema, upstream updates |
| [Evidence workflows](./docs/evidence-workflows.md) | Dependency-aware evidence planning, retry limits, and claim reconciliation |
| [Contributing](./CONTRIBUTING.md) | Development workflow and diagram quality rules |
| [Design system](./DESIGN.md) | Brand assets, semantic colors, layout, motion, accessibility |
| [Examples](./examples/) | Reviewable plans and renderer source JSON |
| [Changelog](./CHANGELOG.md) · [Releases](https://github.com/amirtaherkhani/diago/releases) | Product changes and release notes |

<details>
<summary><strong>Repository map</strong></summary>

```text
skills/       Agent creation, conversation, review, and upstream workflows
bin/          Zero-dependency CLI
mcp/          Native stdio MCP server and tool contracts
lib/          Planning, review, selection, and renderer integration
schemas/      Plan and diagram contracts
examples/     Validated plans and renderer JSON
vendor/       Pinned runtime and methodology snapshots
docs/         GitHub Pages, usage guide, and public brand assets
assets/       Plugin icon and logo
scripts/      Repository validation and upstream automation
test/         Node test suite and renderer checks
```

Run `npm run check` for repository validation and tests. Run `npm run upstreams:check` for read-only source discovery. Upstream changes are reviewed before the canonical skills are updated; [details](./docs/USAGE.md#dependency-updates).

</details>

## License

[MIT](./LICENSE). Third-party copyright and license notices are preserved in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
