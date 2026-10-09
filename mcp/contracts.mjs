import fs from 'node:fs';
import { DIAGRAM_TYPES } from '../lib/diagram-catalog.mjs';
import { fromRoot } from '../lib/paths.mjs';

const closedWorldReadOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const contextProperties = {
  sourceKind: { enum: ['prompt', 'repository', 'conversation', 'mixed'] },
  audienceDetail: { enum: ['technical', 'mixed', 'executive'] },
  destination: { type: 'string', minLength: 1 },
};
const taskProperty = {
  type: 'string',
  minLength: 1,
  maxLength: 10_000,
  description: 'The engineering task or question to visualize.',
};
const adviceOutput = JSON.parse(fs.readFileSync(fromRoot('schemas', 'advice.schema.json'), 'utf8'));
const planOutput = JSON.parse(fs.readFileSync(fromRoot('schemas', 'diagram-plan.schema.json'), 'utf8'));
const workflowInput = JSON.parse(fs.readFileSync(fromRoot('schemas', 'evidence-workflow.schema.json'), 'utf8'));
const workflowOutput = {
  type: 'object',
  required: ['schemaVersion', 'status', 'ok', 'limits', 'ready', 'nodes', 'evidence', 'conflicts', 'rejected', 'unresolved'],
  additionalProperties: false,
  properties: {
    schemaVersion: { const: 1 },
    status: { enum: ['pending', 'complete', 'incomplete'] },
    ok: { type: 'boolean' },
    limits: { type: 'object' },
    ready: { type: 'array', items: { type: 'object' } },
    nodes: { type: 'array', items: { type: 'object' } },
    evidence: { ...planOutput.properties.evidence, properties: Object.fromEntries(
      Object.keys(planOutput.properties.evidence.properties).map((key) => [key, { type: 'array', items: planOutput.$defs.claim }]),
    ) },
    conflicts: { type: 'array', items: { type: 'object' } },
    rejected: { type: 'array', items: { type: 'object' } },
    unresolved: { type: 'array', items: { type: 'object' } },
  },
};
const catalogOutput = {
  type: 'object',
  required: ['schemaVersion', 'types'],
  properties: {
    schemaVersion: { const: 1 },
    types: { type: 'array', items: { type: 'object' } },
  },
  additionalProperties: false,
};
const reviewOutput = {
  type: 'object',
  required: ['schemaVersion', 'ok', 'score', 'findings'],
  properties: {
    schemaVersion: { const: 2 },
    ok: { type: 'boolean' },
    score: { type: 'number', minimum: 0, maximum: 100 },
    findings: { type: 'array', items: { type: 'object' } },
  },
  additionalProperties: false,
};
const validationOutput = {
  type: 'object',
  required: ['ok', 'type', 'input', 'checks', 'composition'],
  properties: {
    ok: { type: 'boolean' },
    type: { enum: [...DIAGRAM_TYPES] },
    input: { type: 'string' },
    checks: { type: 'array' },
    composition: { type: 'object' },
  },
  additionalProperties: false,
};
const renderOutput = {
  type: 'object',
  required: ['schemaVersion', 'ok', 'command', 'type', 'input', 'output', 'artifact', 'validation'],
  properties: {
    schemaVersion: { const: 1 },
    ok: { const: true },
    command: { const: 'deliver' },
    type: { enum: [...DIAGRAM_TYPES] },
    input: { type: 'string' },
    output: { type: 'string' },
    artifact: { type: 'object' },
    validation: { type: 'object' },
  },
  additionalProperties: false,
};

export const TOOL_DEFINITIONS = [
  {
    name: 'render_explorer',
    title: 'Render a Diago architecture explorer',
    description: 'Render a compact shared-component document into one offline Diago HTML with perspective navigation, recursive details, and evidence. Use schemas/architecture-explorer.schema.json; define components and evidence once, then reference IDs in views. Returns only an artifact receipt, not HTML. Does not inspect source code.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      required: ['document', 'outputPath'],
      properties: {
        document: { type: 'object', description: 'schemaVersion 1; title, root view ID, components, evidence, views. See the explorer schema and example.' },
        outputPath: { type: 'string', minLength: 1 },
        overwrite: { type: 'boolean', default: false },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    execution: { taskSupport: 'forbidden' },
  },
  {
    name: 'plan_evidence_workflow',
    title: 'Plan dependency-aware evidence work',
    description: 'Evaluate a caller-owned evidence workflow snapshot. Return bounded ready work, local failures, retry limits, and merged evidence with conflicts retained. Does not launch workers, fetch sources, or independently verify reported claims.',
    inputSchema: {
      type: 'object',
      properties: { workflow: workflowInput },
      required: ['workflow'],
      additionalProperties: false,
    },
    outputSchema: workflowOutput,
    annotations: closedWorldReadOnly,
    execution: { taskSupport: 'forbidden' },
  },
  {
    name: 'list_diagram_types',
    title: 'List native engineering diagram types',
    description: 'List supported native renderers, reader questions, profiles, semantic patterns, complexity ceilings, and fit guidance.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: catalogOutput,
    annotations: closedWorldReadOnly,
    execution: { taskSupport: 'forbidden' },
  },
  {
    name: 'advise_diagram',
    title: 'Choose an engineering diagram',
    description: 'Choose the smallest native view, semantic pattern, profile, and evidence budget for an engineering decision.',
    inputSchema: {
      type: 'object',
      properties: { task: taskProperty, ...contextProperties },
      required: ['task'],
      additionalProperties: false,
    },
    outputSchema: adviceOutput,
    annotations: closedWorldReadOnly,
    execution: { taskSupport: 'forbidden' },
  },
  {
    name: 'create_diagram_plan',
    title: 'Create a diagram plan',
    description: 'Create a schema-v2 evidence-aware plan with selection, scope, complexity, and fidelity contracts.',
    inputSchema: {
      type: 'object',
      properties: { task: taskProperty, ...contextProperties },
      required: ['task'],
      additionalProperties: false,
    },
    outputSchema: planOutput,
    annotations: closedWorldReadOnly,
    execution: { taskSupport: 'forbidden' },
  },
  {
    name: 'review_diagram_plan',
    title: 'Review a diagram plan',
    description: 'Review a schema-v1 or v2 plan for evidence, type/profile fit, complexity, fidelity, and decision usefulness.',
    inputSchema: {
      type: 'object',
      properties: { plan: { type: 'object' } },
      required: ['plan'],
      additionalProperties: false,
    },
    outputSchema: reviewOutput,
    annotations: closedWorldReadOnly,
    execution: { taskSupport: 'forbidden' },
  },
  {
    name: 'validate_diagram',
    title: 'Validate engineering diagram JSON',
    description: 'Validate native engineering diagram JSON with its schema, renderer, accessibility, and composition checks.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { enum: [...DIAGRAM_TYPES] },
        diagram: { type: 'object' },
        quality: { enum: ['standard', 'showcase'], default: 'showcase' },
      },
      required: ['type', 'diagram'],
      additionalProperties: false,
    },
    outputSchema: validationOutput,
    annotations: closedWorldReadOnly,
    execution: { taskSupport: 'forbidden' },
  },
  {
    name: 'render_diagram',
    title: 'Render a standalone engineering diagram',
    description: 'Validate and render native diagram JSON to a standalone interactive HTML file at an absolute local path.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { enum: [...DIAGRAM_TYPES] },
        diagram: { type: 'object' },
        outputPath: { type: 'string', minLength: 1 },
        quality: { enum: ['standard', 'showcase'], default: 'showcase' },
        overwrite: { type: 'boolean', default: false },
      },
      required: ['type', 'diagram', 'outputPath'],
      additionalProperties: false,
    },
    outputSchema: renderOutput,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    execution: { taskSupport: 'forbidden' },
  },
];
