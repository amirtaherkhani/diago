const entries = [
  {
    type: 'architecture',
    question: 'What exists, what owns it, and how do boundaries connect?',
    profiles: ['feature-context', 'system-context', 'deployment-topology', 'trust-boundary', 'design-pattern'],
    semanticPatterns: ['structural-ownership-dependency', 'trust-boundary-routing'],
    budget: { components: 12, connections: 16, boundaries: 4 },
    engine: 'archify',
    supported: true,
    appropriate: 'Components, ownership, dependencies, runtime topology, or trust boundaries.',
    inappropriate: 'Precise call order, entity cardinality, or milestone chronology.',
  },
  {
    type: 'sequence',
    question: 'What happens over time between participants?',
    profiles: ['request-walkthrough', 'integration-exchange', 'async-retry', 'failure-compensation'],
    semanticPatterns: ['ordered-interaction-response'],
    budget: { participants: 6, messages: 16, conditionalSegments: 2 },
    engine: 'archify',
    supported: true,
    appropriate: 'Ordered calls, responses, retries, and compensation across participants.',
    inappropriate: 'Static ownership maps or long delivery roadmaps.',
  },
  {
    type: 'workflow',
    question: 'Which steps, decisions, owners, and handoffs control the outcome?',
    profiles: ['decision-flow', 'swimlane', 'delivery-process', 'incident-response'],
    semanticPatterns: ['branching-decision-approval', 'cross-owner-handoff'],
    budget: { lanes: 5, steps: 12, edges: 16 },
    engine: 'archify',
    supported: true,
    appropriate: 'Branches, approvals, owners, validation gates, and failure exits.',
    inappropriate: 'Pure component topology or field-level data models.',
  },
  {
    type: 'dataflow',
    question: 'Where does data originate, transform, move, and persist?',
    profiles: ['event-lineage', 'transformation-pipeline', 'queue-bottleneck'],
    semanticPatterns: ['data-lineage-transformation', 'fan-in-queue-capacity'],
    budget: { stages: 6, nodes: 12, flows: 16 },
    engine: 'archify',
    supported: true,
    appropriate: 'Data sources, transformations, transport, delivery semantics, and stores.',
    inappropriate: 'Table cardinality or control-only decision paths.',
  },
  {
    type: 'lifecycle',
    question: 'How does one entity change state and recover?',
    profiles: ['state-machine', 'job-lifecycle', 'retry-recovery'],
    semanticPatterns: ['state-transition-recovery'],
    budget: { states: 12, transitions: 16 },
    engine: 'archify',
    supported: true,
    appropriate: 'States, transition guards, terminal outcomes, retries, and recovery.',
    inappropriate: 'Multi-service request chronology or infrastructure ownership.',
  },
  {
    type: 'data-model',
    question: 'Which entities, fields, constraints, and relationships define the domain?',
    profiles: ['domain-model', 'persistence-schema', 'event-model'],
    semanticPatterns: ['entity-relationship-cardinality'],
    budget: { entities: 8, relationships: 12 },
    engine: 'native',
    supported: true,
    appropriate: 'Domain entities, persisted fields, keys, constraints, and cardinality.',
    inappropriate: 'Data movement, runtime calls, or invented schema detail.',
  },
  {
    type: 'timeline',
    question: 'Which engineering events or milestones occur, and in what temporal relationship?',
    profiles: ['delivery-roadmap', 'migration-plan', 'incident-timeline', 'release-history'],
    semanticPatterns: ['milestone-migration-progression'],
    budget: { milestones: 12, tracks: 4 },
    engine: 'native',
    supported: true,
    appropriate: 'Delivery milestones, migrations, incident chronology, and release history.',
    inappropriate: 'Unknown dates presented with false precision or branching decisions.',
  },
  {
    type: 'layers',
    question: 'Where are responsibilities, abstractions, controls, or defenses enforced?',
    profiles: ['application-layers', 'platform-stack', 'control-enforcement', 'defense-layers'],
    semanticPatterns: ['layered-responsibility-enforcement', 'compensating-defenses-risk'],
    budget: { layers: 7, items: 24 },
    engine: 'native',
    supported: true,
    appropriate: 'Application responsibility, platform stacks, control placement, or defense in depth.',
    inappropriate: 'Physical deployment topology or chronological interaction detail.',
  },
];

export const DIAGRAM_TYPES = Object.freeze(entries.map(({ type }) => type));

export class UnsupportedDiagramTypeError extends Error {
  constructor(type) {
    super(`Unsupported diagram type "${type}". Native types: ${DIAGRAM_TYPES.join(', ')}.`);
    this.name = 'UnsupportedDiagramTypeError';
    this.type = type;
  }
}

function copyEntry(entry) {
  return {
    ...entry,
    profiles: [...entry.profiles],
    semanticPatterns: [...entry.semanticPatterns],
    budget: { ...entry.budget },
  };
}

export function listDiagramTypes() {
  return entries.filter(({ supported }) => supported).map(copyEntry);
}

export function getDiagramType(type) {
  const entry = entries.find((candidate) => candidate.type === type && candidate.supported);
  if (!entry) throw new UnsupportedDiagramTypeError(type);
  return copyEntry(entry);
}

export function getProfile(type, profile) {
  const entry = getDiagramType(type);
  if (!entry.profiles.includes(profile)) {
    throw new TypeError(`Profile "${profile}" is not supported by ${type}. Expected: ${entry.profiles.join(', ')}.`);
  }
  return profile;
}
