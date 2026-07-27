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
  <a href="https://github.com/amirtaherkhani/diago/actions/workflows/container.yml"><img alt="Container" src="https://github.com/amirtaherkhani/diago/actions/workflows/container.yml/badge.svg"></a>
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

Diago turns a task, feature, code path, design pattern, incident, or best-practice discussion into the smallest useful software engineering diagram. It combines an evidence-aware agent workflow, five native MCP tools, a deterministic CLI, and an interactive renderer in one repository that works with both OpenAI Codex and Claude Code.

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

## Install

### Codex

Add the GitHub repository as a Codex marketplace, then install the plugin:

```bash
codex plugin marketplace add amirtaherkhani/diago
codex plugin add diago@diago
```

Start a new thread and try:

```text
Use $engineering-diagram to visualize this feature from API entry point to persistence.
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
/diago:engineering-diagram
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
node bin/diago.mjs advise "trace an idempotent checkout API request" --json
node bin/diago.mjs plan "trace an idempotent checkout API request" --out checkout.plan.json
node bin/diago.mjs review examples/checkout-feature.diagram-plan.json
node bin/diago.mjs validate architecture examples/plugin-request.architecture.json --quality showcase
node bin/diago.mjs render architecture examples/plugin-request.architecture.json diagram.html --quality showcase
```

### Kubernetes

Run the shared Streamable HTTP MCP server with the included Helm chart:

```bash
helm upgrade --install diago ./charts/diago \
  --namespace diago \
  --create-namespace \
  --wait

kubectl -n diago port-forward service/diago 3000:80
codex mcp add diago-k8s --url http://127.0.0.1:3000/mcp
```

The chart includes startup, liveness, and readiness probes; a non-root read-only container; optional bearer authentication and Ingress; and optional persistent storage for rendered HTML. See the complete [Kubernetes installation and MCP usage guide](./docs/kubernetes.md), including Claude Code setup and direct protocol examples.

## Use after installation

Open the repository you want to explain, start a new Codex or Claude Code thread, and describe the engineering decision you need to make. Diago inspects the relevant source, selects the smallest useful view, separates verified facts from assumptions and recommendations, validates the diagram, and renders a standalone HTML artifact.

For Codex, mention the skill directly:

```text
Use $engineering-diagram to map this feature from its API entry point to persistence. Inspect the code, separate facts from assumptions, and render architecture and sequence views.
```

For Claude Code, invoke the namespaced skill and then provide the task:

```text
/diago:engineering-diagram
Map this feature from its API entry point to persistence. Inspect the code, separate facts from assumptions, and render architecture and sequence views.
```

### Example prompts

**Feature architecture**

```text
Use $engineering-diagram to map this feature from its API entry point to persistence. Show ownership boundaries, external dependencies, and the request sequence.
```

**Design pattern**

```text
Use $engineering-diagram to evaluate whether the Strategy pattern fits this task. Show the current coupling, proposed objects, tradeoffs, and where the pattern should not be used.
```

**Best-practice rollout**

```text
Use $engineering-diagram to find the safest workflow for rolling out this schema change. Show owners, validation gates, failure paths, rollback steps, and the evidence for each recommendation.
```

**Lifecycle or incident flow**

```text
Use $engineering-diagram to visualize this background job lifecycle, including retries, timeouts, recovery paths, and terminal states.
```

**Review an existing diagram**

```text
Use $review-diagram to audit this diagram against the repository. List unsupported claims, missing boundaries, ambiguous edges, and visual issues, then recommend focused corrections.
```

In Claude Code, replace `$engineering-diagram` with `/diago:engineering-diagram` and `$review-diagram` with `/diago:review-diagram`.

## Native MCP tools

Codex and Claude can call the same deterministic core directly:

| Tool | Purpose | State |
| --- | --- | --- |
| `advise_diagram` | Choose the smallest useful view for a task | read-only |
| `create_diagram_plan` | Establish scope, evidence lanes, and the primary question | read-only |
| `review_diagram_plan` | Find unsupported facts and missing decision context | read-only |
| `validate_diagram` | Run schema, renderer, accessibility, and composition checks | read-only |
| `render_diagram` | Deliver validated standalone HTML to an absolute path | local write |

The server implements MCP over stdio for local plugins and Streamable HTTP for shared or Kubernetes deployments, without runtime npm dependencies. Its portable launcher resolves from Claude's plugin-root environment or Codex's plugin working directory, and each structured result also includes a text representation for compatibility.

## Included skills

### `engineering-diagram`

Inspects source evidence, selects the right view, separates facts from assumptions and recommendations, authors JSON IR, validates the result, and delivers a reviewable standalone diagram.

Example prompts:

- “Map this feature from controller to database and show the trust boundaries.”
- “Explain the Strategy pattern for this task, including why it fits and where it does not.”
- “Visualize the async job lifecycle, retry policy, and terminal failure states.”
- “Find the clearest best-practice workflow for rolling out this schema change.”

### `review-diagram`

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

The canonical plan keeps three claim lanes:

```json
{
  "evidence": {
    "facts": [{ "statement": "The API requires an idempotency key.", "source": "openapi.json" }],
    "assumptions": [{ "statement": "Reservations expire.", "source": "product confirmation needed" }],
    "recommendations": [{ "statement": "Persist replay results.", "source": "toolkit guidance" }]
  }
}
```

See [`schemas/diagram-plan.schema.json`](./schemas/diagram-plan.schema.json), the [checkout plan](./examples/checkout-feature.diagram-plan.json), and the [architecture example](./examples/plugin-request.architecture.json).

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
  engineering-diagram/      creation workflow and evidence contract
  review-diagram/           correctness and visual review workflow
bin/                        zero-dependency CLI
mcp/                        stdio and Streamable HTTP MCP transports
charts/diago/               hardened Kubernetes Helm chart
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
helm lint charts/diago
helm template diago charts/diago >/dev/null
```

The test suite covers stdio and Streamable HTTP MCP initialization, sessions, authentication, tools, recommendation selection, evidence review, plugin health, plan creation, renderer showcase validation, output-root enforcement, overwrite protection, and standalone HTML rendering.

## Contributing

Diagram recipes, accessibility improvements, examples, renderer adapters, and agent compatibility fixes are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

Diago is available under the [MIT License](./LICENSE). Required third-party copyright and license notices are preserved in [third-party notices](./THIRD_PARTY_NOTICES.md).
