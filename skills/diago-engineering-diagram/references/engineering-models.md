# Additional engineering models

Load the corresponding root schema and example; do not invent fields or geometry.

| Type | Schema | Example |
| --- | --- | --- |
| dependency | `schemas/dependency.schema.json` | `examples/checkout.dependency.json` |
| security-matrix | `schemas/security-matrix.schema.json` | `examples/platform.security-matrix.json` |
| fishbone | `schemas/fishbone.schema.json` | `examples/latency.fishbone.json` |

Dependency arrows mean dependent → dependency. Cycles are computed from all authored edges, including assumptions/proposals; direct fan-in is not transitive blast radius. Reject self edges, duplicate pairs, and more than four condensed ranks. Keep evidence for nodes and edges. The renderer provides a connection walkthrough.

Access matrices document roles × resources; they do not evaluate authorization. Preserve exact permission text, access category, environment, and source. An omitted cell is unknown, never no-access. Use `none` only for an explicitly evidenced deny. The register contains every pair.

Fishbones group investigated candidates for one observed effect. Categories must be nonempty; every cause has evidence/context and an explicit hypothesis, confirmed, or ruled-out status. Zero or multiple confirmed contributors are valid. The renderer validates structure, not causal truth. Use timeline for event chronology.

Do not add directed walkthroughs to matrices or fishbones. Use their complete evidence tables. All three have built-in light/dark and narrow-screen layouts. Author bounded JSON once; do not repeat generated HTML/CSS in model output.
