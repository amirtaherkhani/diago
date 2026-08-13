<p align="center">
  <img src="./docs/assets/mark.svg" width="82" height="82" alt="Diago">
</p>

<h1 align="center">Diago</h1>

<p align="center">
  AI-powered software engineering diagrams for Codex and Claude—grounded in code, explicit about uncertainty, and rendered as interactive standalone HTML.
</p>

<p align="center">
  <a href="https://github.com/amirtaherkhani/diago/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/amirtaherkhani/diago/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/amirtaherkhani/diago/actions/workflows/pages.yml"><img alt="GitHub Pages" src="https://github.com/amirtaherkhani/diago/actions/workflows/pages.yml/badge.svg"></a>
  <a href="https://github.com/amirtaherkhani/diago/releases"><img alt="Release" src="https://img.shields.io/github/v/release/amirtaherkhani/diago?display_name=tag"></a>
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-6ef3c5"></a>
  <img alt="Node 18+" src="https://img.shields.io/badge/node-%E2%89%A518-6ca8ff">
</p>

<p align="center">
  <a href="https://amirtaherkhani.github.io/diago/"><strong>Explore the live site</strong></a>
  ·
  <a href="#install">Install</a>
  ·
  <a href="#use-after-installation">Use it</a>
  ·
  <a href="#how-it-works">How it works</a>
</p>

![Diago: make the system visible before you change it](./docs/assets/og-card.png)

Diago turns a task, feature, code path, design pattern, incident, or best-practice discussion into the smallest useful software engineering diagram. It provides an evidence-aware agent workflow, six native MCP tools, a deterministic CLI, and interactive standalone renderers for OpenAI Codex and Claude Code.

## Why this exists

Most generated architecture diagrams fail in one of two ways: they are attractive but unverified, or accurate but too dense to support a decision. This toolkit treats a diagram as an engineering artifact:

- Important nodes and edges trace back to code, contracts, runtime evidence, or an explicit requirement.
- Verified facts, assumptions, and recommendations stay visibly distinct.
- Each view answers one question instead of attempting to show the entire system.
- JSON source is validated before standalone HTML is delivered.
- Mobile layout, keyboard focus, contrast, and reduced motion are quality gates.

## What it can visualize

| View | Best question | Typical use |
| --- | --- | --- |
| Architecture | What exists and who depends on it? | feature boundaries, services, modules, deployment topology, design patterns |
| Sequence | What happens over time? | API requests, webhooks, retries, provider integrations |
| Workflow | Which steps and decisions control the outcome? | implementation plans, approvals, incident response, best practices |
| Dataflow | Where does data originate, transform, and land? | events, queues, analytics, storage, data ownership |
| Lifecycle | How does an entity change state? | jobs, deployments, orders, sessions, incident states |
| Data model | Which entities, fields, constraints, and relationships define the domain? | domain models, database schemas, event contracts, cardinality |
| Timeline | Which engineering milestones occur, and in what temporal relationship? | migrations, releases, incidents, delivery roadmaps |
| Layers | Where are responsibilities, abstractions, controls, or defenses enforced? | application layers, platform stacks, control placement, defense in depth |

Each renderer exposes engineering-specific profiles, semantic patterns, and validated complexity ceilings. Diago records the selected profile and any information merged, collapsed, or omitted, then splits oversized sources into bounded overview and detail views instead of shrinking text or hiding edges.

## Install

### Codex

Add the GitHub repository as a Codex marketplace, then install the plugin:

```bash
codex plugin marketplace add amirtaherkhani/diago
codex plugin add diago@diago
```

Start a new thread and try:

```text
Use $diago-engineering-diagram to visualize this feature from API entry point to persistence.
```

### Claude Code

Run these commands inside Claude Code:

```text
/plugin marketplace add amirtaherkhani/diago
/plugin install diago@diago
/reload-plugins
```

Then invoke the namespaced skill:

```text
/diago:diago-engineering-diagram
```

Both plugin installs start the bundled `engineering-diagrams` stdio server automatically. No separate MCP registration or API key is required.

### CLI

The CLI has no runtime npm dependencies:

```bash
git clone https://github.com/amirtaherkhani/diago.git
cd diago
node bin/diago.mjs doctor
```

Choose a diagram, create a plan, review it, then render:

```bash
node bin/diago.mjs types --json
node bin/diago.mjs advise "trace an idempotent checkout API request" --json
node bin/diago.mjs plan "trace an idempotent checkout API request" --out checkout.plan.json
node bin/diago.mjs review examples/checkout-feature.diagram-plan.json
node bin/diago.mjs validate architecture examples/plugin-request.architecture.json --quality showcase
node bin/diago.mjs render architecture examples/plugin-request.architecture.json diagram.html --quality showcase
```

### Connect the MCP server directly to Codex

Register Diago as a native stdio MCP server:

```bash
git clone https://github.com/amirtaherkhani/diago.git
cd diago
codex mcp add diago -- node "$PWD/mcp/server.mjs"
codex mcp get diago
```

Restart the Codex app or open a new Codex session after registration. The Codex app, CLI, and IDE extension share this MCP configuration.

### Connect the MCP server directly to Claude Code

Register the same bundled stdio server in Claude Code:

```bash
git clone https://github.com/amirtaherkhani/diago.git
cd diago
claude mcp add --transport stdio diago -- node "$PWD/mcp/server.mjs"
claude mcp get diago
```

Diago supports the standard local stdio MCP transport for Codex and Claude Code. It does not require a cluster, HTTP endpoint, bearer token, or API key.

## Use after installation

Open the repository you want to explain, start a new Codex or Claude Code thread, and describe the engineering decision you need to make. You can provide a prompt, a project, the active conversation, selected chat history, or mixed evidence. Diago records that source boundary, selects the smallest useful view, separates verified facts from assumptions, recommendations, and superseded decisions, validates the diagram, and renders a standalone HTML artifact.

For Codex, mention the skill directly:

```text
Use $diago-engineering-diagram to map this feature from its API entry point to persistence. Inspect the code, separate facts from assumptions, and render architecture and sequence views.
```

For Claude Code, invoke the namespaced skill and then provide the task:

```text
/diago:diago-engineering-diagram
Map this feature from its API entry point to persistence. Inspect the code, separate facts from assumptions, and render architecture and sequence views.
```

### Example prompts

**Feature architecture**

```text
Use $diago-engineering-diagram to map this feature from its API entry point to persistence. Show ownership boundaries, external dependencies, and the request sequence.
```

**Design pattern**

```text
Use $diago-engineering-diagram to evaluate whether the Strategy pattern fits this task. Show the current coupling, proposed objects, tradeoffs, and where the pattern should not be used.
```

**Best-practice rollout**

```text
Use $diago-engineering-diagram to find the safest workflow for rolling out this schema change. Show owners, validation gates, failure paths, rollback steps, and the evidence for each recommendation.
```

**Lifecycle or incident flow**

```text
Use $diago-engineering-diagram to visualize this background job lifecycle, including retries, timeouts, recovery paths, and terminal states.
```

**Review an existing diagram**

```text
Use $diago-review-diagram to audit this diagram against the repository. List unsupported claims, missing boundaries, ambiguous edges, and visual issues, then recommend focused corrections.
```

**Architecture from the active conversation**

```text
Use $diago-chat-architecture to turn this conversation into a software architecture visualization. Show every important component, what it owns, how it connects to the other parts, and how the parts work together. Separate current behavior, proposals, assumptions, and unresolved questions.
```

**Architecture from selected chat history**

```text
Use $diago-chat-architecture to visualize the architecture discussed in the supplied conversation history. Reconcile later decisions with earlier proposals, show component responsibilities and directed connections, and add a sequence view when ordering is important.
```

**Domain data model**

```text
Use $diago-engineering-diagram to inspect this repository's order domain and render a data-model view. Show verified entities, keys, constraints, cardinality, and proposed schema changes without inventing missing relationships.
```

**Migration timeline**

```text
Use $diago-engineering-diagram to turn this migration plan and repository evidence into an engineering timeline. Show phases, dependencies, owners, validation gates, and rollback milestones; use ordered phases when dates are not confirmed.
```

**Architecture layers and controls**

```text
Use $diago-engineering-diagram to show where authentication, authorization, validation, observability, and data-protection controls are enforced across this system's layers. Mark gaps and unsupported assumptions explicitly.
```

In Claude Code, replace `$diago-engineering-diagram` with `/diago:diago-engineering-diagram`, `$diago-chat-architecture` with `/diago:diago-chat-architecture`, and `$diago-review-diagram` with `/diago:diago-review-diagram`.

## Native MCP tools

Codex and Claude can call the same deterministic core directly:

| Tool | Purpose | State |
| --- | --- | --- |
| `list_diagram_types` | Discover the eight renderers, profiles, semantic patterns, and budgets | read-only |
| `advise_diagram` | Choose the smallest useful view for a task | read-only |
| `create_diagram_plan` | Establish scope, evidence lanes, and the primary question | read-only |
| `review_diagram_plan` | Find unsupported facts and missing decision context | read-only |
| `validate_diagram` | Run schema, renderer, accessibility, and composition checks | read-only |
| `render_diagram` | Deliver validated standalone HTML to an absolute path | local write |

The server implements the standard MCP stdio transport for local Codex and Claude Code integrations, without runtime npm dependencies. Its portable launcher resolves from Claude's plugin-root environment or Codex's plugin working directory, and each structured result also includes a text representation for compatibility.

## Included skills

### `diago-engineering-diagram`

Inspects prompt, repository, conversation, or mixed evidence; selects the reader question, semantic pattern, profile, and renderer; authors JSON IR; validates the result; and delivers a reviewable standalone diagram.

Example prompts:

- “Map this feature from controller to database and show the trust boundaries.”
- “Explain the Strategy pattern for this task, including why it fits and where it does not.”
- “Visualize the async job lifecycle, retry policy, and terminal failure states.”
- “Map the verified entities and cardinality in this domain.”
- “Build a migration timeline without inventing dates.”
- “Show where security controls are enforced across the architecture layers.”
- “Find the clearest best-practice workflow for rolling out this schema change.”

### `diago-chat-architecture`

Turns the active conversation, accessible chat history, or a supplied transcript into a connected architecture visualization. It extracts components, responsibilities, boundaries, and directed relationships; reconciles changed decisions; and explains how the parts collaborate without exposing hidden context or inventing unavailable history.

Example prompts:

- “Visualize the software architecture we designed in this conversation.”
- “Show each component, what it owns, and how it connects to every other relevant part.”
- “Turn this exported chat into architecture and sequence views, separating accepted decisions from earlier proposals.”
- “Explain how the components work together from the initiating request to the final result.”

### `diago-review-diagram`

Audits an existing diagram for unsupported claims, missing boundaries, ambiguous edges, visual defects, accessibility, and decision usefulness.

Example prompts:

- “Review this diagram against the repository and list unsupported architecture claims.”
- “Check whether current behavior and the proposed design are visually distinct.”
- “Validate this JSON and inspect the HTML at mobile and desktop widths.”

## How it works

```text
task or feature
      │
      ▼
source evidence ──► diagram plan ──► diagram JSON IR ──► validated HTML
      ▲                   │                                  │
      └──────────── review findings ◄────────────────────────┘
```

New plans use schema v2. The contract preserves evidence lanes and adds the input source, audience, selection rationale, complexity budget, decomposition decision, and fidelity ledger. This compact excerpt highlights the new fields; the linked examples below contain complete, reviewable plans:

```json
{
  "schemaVersion": 2,
  "source": { "kind": "repository", "scope": "main", "references": ["src/checkout"] },
  "audience": { "role": "backend engineers", "detail": "technical" },
  "selection": {
    "semanticPattern": "trust-boundary-routing",
    "renderer": "architecture",
    "profile": "feature-context"
  },
  "evidence": {
    "facts": [{ "statement": "The API requires an idempotency key.", "source": "openapi.json" }],
    "assumptions": [{ "statement": "Reservations expire.", "source": "product confirmation needed" }],
    "recommendations": [{ "statement": "Persist replay results.", "source": "toolkit guidance" }],
    "superseded": []
  },
  "complexity": { "detail": "balanced", "decomposition": "single" },
  "fidelity": { "merged": [], "collapsed": [], "omitted": [], "preserved": [] }
}
```

Legacy schema-v1 plans remain reviewable through non-mutating compatibility normalization; newly generated plans are v2. See [`schemas/diagram-plan.schema.json`](./schemas/diagram-plan.schema.json), the [checkout plan](./examples/checkout-feature.diagram-plan.json), the [repository plan](./examples/repository-domain.diagram-plan.json), the [conversation plan](./examples/conversation-architecture.diagram-plan.json), and the native [data model](./examples/order-domain.data-model.json), [timeline](./examples/payment-migration.timeline.json), and [layers](./examples/checkout-controls.layers.json) examples.

## Dependency updates

The scheduled dependency workflow checks pinned sources every week. Each update is isolated in a reviewable pull request with checks for:

- license and security changes;
- schema and rendering compatibility;
- evidence semantics and visual quality;
- the complete `npm run check` suite.

Run the read-only check locally:

```bash
npm run upstreams:check
```

Dependency updates never silently rewrite the canonical skills.

## Repository structure

```text
.codex-plugin/              Codex plugin manifest
.claude-plugin/             Claude plugin + marketplace
.agents/plugins/            Codex repository marketplace
skills/
  diago-chat-architecture/ architecture extraction from active chat or history
  diago-engineering-diagram/      creation workflow and evidence contract
  diago-review-diagram/           correctness and visual review workflow
bin/                        zero-dependency CLI
mcp/                        standard stdio MCP server and native tools
knowledge/                  diagram selection recipes
schemas/                    plan and advice contracts
examples/                   validated plans and renderer JSON
vendor/                     pinned runtime and methodology snapshots
docs/                       GitHub Pages site
scripts/                    validation and dependency automation
test/                       Node test suite and renderer smoke tests
```

## Development

```bash
npm install --ignore-scripts
npm run check
```

The test suite covers stdio MCP initialization, six tool contracts, renderer discovery, recommendation selection, schema-v1 compatibility, schema-v2 planning, evidence review, plugin health, all eight renderer paths, output-root enforcement, overwrite protection, and standalone HTML rendering.

## Contributing

Diagram recipes, accessibility improvements, examples, renderer adapters, and agent compatibility fixes are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

Diago is available under the [MIT License](./LICENSE). Required third-party copyright and license notices are preserved in [third-party notices](./THIRD_PARTY_NOTICES.md).
