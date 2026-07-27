import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runArchify } from '../lib/archify.mjs';
import { createPlan } from '../lib/planner.mjs';
import { fromRoot } from '../lib/paths.mjs';
import { advise } from '../lib/recommender.mjs';
import { reviewPlan } from '../lib/reviewer.mjs';

const DIAGRAM_TYPES = ['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle'];
const QUALITY_PROFILES = ['standard', 'showcase'];
const MAX_TASK_LENGTH = 10_000;
const MAX_DIAGRAM_BYTES = 2_000_000;

const closedWorldReadOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const adviceOutput = JSON.parse(
  fs.readFileSync(fromRoot('schemas', 'advice.schema.json'), 'utf8'),
);
const planOutput = JSON.parse(
  fs.readFileSync(fromRoot('schemas', 'diagram-plan.schema.json'), 'utf8'),
);
const reviewOutput = {
  type: 'object',
  required: ['schemaVersion', 'ok', 'score', 'findings'],
  properties: {
    schemaVersion: { const: 1 },
    ok: { type: 'boolean' },
    score: { type: 'number', minimum: 0, maximum: 100 },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'code', 'message', 'path'],
        properties: {
          severity: { enum: ['blocker', 'high', 'medium', 'low'] },
          code: { type: 'string' },
          message: { type: 'string' },
          path: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};
const validationOutput = {
  type: 'object',
  required: ['ok', 'type', 'input', 'checks', 'composition'],
  properties: {
    ok: { type: 'boolean' },
    type: { enum: DIAGRAM_TYPES },
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
    type: { enum: DIAGRAM_TYPES },
    input: { type: 'string' },
    output: { type: 'string' },
    artifact: {
      type: 'object',
      required: ['sha256', 'bytes'],
      properties: {
        sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' },
        bytes: { type: 'integer', minimum: 1 },
      },
      additionalProperties: false,
    },
    validation: { type: 'object' },
  },
  additionalProperties: false,
};

export const TOOL_DEFINITIONS = [
  {
    name: 'advise_diagram',
    title: 'Choose an engineering diagram',
    description: 'Use when a task, feature, code path, design pattern, incident, or best-practice question needs the smallest useful diagram type and evidence checklist.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          minLength: 1,
          maxLength: MAX_TASK_LENGTH,
          description: 'The engineering task or question to visualize.',
        },
      },
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
    description: 'Create an evidence-aware diagram plan with scope, claim lanes, constraints, and a recommended primary view before authoring renderer JSON.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          minLength: 1,
          maxLength: MAX_TASK_LENGTH,
          description: 'The engineering task or question the diagram must clarify.',
        },
      },
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
    description: 'Review a diagram plan for missing evidence, unsupported facts, invalid view types, unclear scope, and decision usefulness.',
    inputSchema: {
      type: 'object',
      properties: {
        plan: {
          type: 'object',
          description: 'A diagram plan following schemas/diagram-plan.schema.json.',
        },
      },
      required: ['plan'],
      additionalProperties: false,
    },
    outputSchema: reviewOutput,
    annotations: closedWorldReadOnly,
    execution: { taskSupport: 'forbidden' },
  },
  {
    name: 'validate_diagram',
    title: 'Validate Archify diagram JSON',
    description: 'Validate an architecture, workflow, sequence, dataflow, or lifecycle JSON object with the bundled Archify schema, renderer, accessibility, and composition checks.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: DIAGRAM_TYPES,
          description: 'The Archify diagram type.',
        },
        diagram: {
          type: 'object',
          description: 'The complete Archify JSON intermediate representation to validate.',
        },
        quality: {
          type: 'string',
          enum: QUALITY_PROFILES,
          default: 'showcase',
          description: 'The composition quality profile.',
        },
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
    title: 'Render a standalone diagram',
    description: 'Validate and render Archify JSON to a standalone interactive HTML file at an absolute local path. Set overwrite only when replacing an existing artifact is intended.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: DIAGRAM_TYPES,
          description: 'The Archify diagram type.',
        },
        diagram: {
          type: 'object',
          description: 'The complete Archify JSON intermediate representation to render.',
        },
        outputPath: {
          type: 'string',
          minLength: 1,
          description: 'Absolute path for the standalone .html artifact.',
        },
        quality: {
          type: 'string',
          enum: QUALITY_PROFILES,
          default: 'showcase',
          description: 'The composition quality profile.',
        },
        overwrite: {
          type: 'boolean',
          default: false,
          description: 'Allow replacement when outputPath already exists.',
        },
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

export class UnknownToolError extends Error {
  constructor(name) {
    super(`Unknown tool: ${name}`);
    this.name = 'UnknownToolError';
  }
}

function textResult(data, summary) {
  const serialized = JSON.stringify(data, null, 2);
  return {
    content: [
      {
        type: 'text',
        text: summary ? `${summary}\n\n${serialized}` : serialized,
      },
    ],
    structuredContent: data,
    isError: false,
  };
}

function errorResult(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireObject(value, name) {
  if (!isPlainObject(value)) throw new TypeError(`${name} must be a JSON object.`);
  const bytes = Buffer.byteLength(JSON.stringify(value));
  if (bytes > MAX_DIAGRAM_BYTES) {
    throw new TypeError(`${name} is too large. The limit is ${MAX_DIAGRAM_BYTES} bytes.`);
  }
  return value;
}

function requireKeys(args, allowed, required) {
  const unknown = Object.keys(args).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw new TypeError(`Unknown argument${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}.`);
  }
  const missing = required.filter((key) => !(key in args));
  if (missing.length) {
    throw new TypeError(`Missing required argument${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`);
  }
}

function requireTask(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('task must be a non-empty string.');
  }
  if (value.length > MAX_TASK_LENGTH) {
    throw new TypeError(`task is too long. The limit is ${MAX_TASK_LENGTH} characters.`);
  }
  return value.trim();
}

function requireType(value) {
  if (!DIAGRAM_TYPES.includes(value)) {
    throw new TypeError(`type must be one of: ${DIAGRAM_TYPES.join(', ')}.`);
  }
  return value;
}

function requireQuality(value) {
  const quality = value ?? 'showcase';
  if (!QUALITY_PROFILES.includes(quality)) {
    throw new TypeError(`quality must be one of: ${QUALITY_PROFILES.join(', ')}.`);
  }
  return quality;
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${label} returned an unreadable response.`);
  }
}

function sanitizeDiagnostic(value, temporaryDirectory) {
  return String(value || 'The bundled renderer failed without a diagnostic.')
    .replaceAll(temporaryDirectory, '<temporary-directory>')
    .trim()
    .slice(0, 20_000);
}

function canonicalIntendedPath(target) {
  const missingSegments = [];
  let existingPath = target;

  while (!fs.existsSync(existingPath)) {
    const parent = path.dirname(existingPath);
    if (parent === existingPath) break;
    missingSegments.unshift(path.basename(existingPath));
    existingPath = parent;
  }

  const canonicalExistingPath = fs.realpathSync(existingPath);
  return path.resolve(canonicalExistingPath, ...missingSegments);
}

function enforceOutputRoot(outputPath) {
  const configuredRoot = process.env.DIAGO_OUTPUT_ROOT?.trim();
  if (!configuredRoot) return;
  if (!path.isAbsolute(configuredRoot)) {
    throw new TypeError('DIAGO_OUTPUT_ROOT must be an absolute path.');
  }
  if (!fs.existsSync(configuredRoot)) {
    throw new TypeError(`DIAGO_OUTPUT_ROOT does not exist: ${configuredRoot}`);
  }

  const canonicalRoot = fs.realpathSync(configuredRoot);
  const canonicalOutput = canonicalIntendedPath(outputPath);
  const relative = path.relative(canonicalRoot, canonicalOutput);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new TypeError(`outputPath must stay inside DIAGO_OUTPUT_ROOT (${canonicalRoot}).`);
  }
}

function withTemporaryDiagram(diagram, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-diagram-mcp-'));
  const input = path.join(directory, 'diagram.json');
  try {
    fs.writeFileSync(input, `${JSON.stringify(diagram, null, 2)}\n`, { flag: 'wx' });
    return callback({ directory, input });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function validateDiagram(args) {
  const type = requireType(args.type);
  const diagram = requireObject(args.diagram, 'diagram');
  const quality = requireQuality(args.quality);

  return withTemporaryDiagram(diagram, ({ directory, input }) => {
    const result = runArchify(
      ['validate', type, input, '--quality', quality, '--json'],
      { capture: true },
    );
    if (result.error) return errorResult(`Could not start the bundled renderer: ${result.error.message}`);
    if (result.status !== 0) {
      return errorResult(sanitizeDiagnostic(result.stderr || result.stdout, directory));
    }
    const validation = parseJsonOutput(result.stdout, 'Archify validation');
    validation.input = '<inline-diagram>';
    return textResult(validation);
  });
}

function renderDiagram(args) {
  const type = requireType(args.type);
  const diagram = requireObject(args.diagram, 'diagram');
  const quality = requireQuality(args.quality);
  const outputPath = args.outputPath;

  if (typeof outputPath !== 'string' || !path.isAbsolute(outputPath)) {
    throw new TypeError('outputPath must be an absolute path.');
  }
  if (path.extname(outputPath).toLowerCase() !== '.html') {
    throw new TypeError('outputPath must end in .html.');
  }
  enforceOutputRoot(outputPath);
  if (args.overwrite !== undefined && typeof args.overwrite !== 'boolean') {
    throw new TypeError('overwrite must be a boolean.');
  }
  if (fs.existsSync(outputPath) && args.overwrite !== true) {
    return errorResult(`Refusing to replace existing artifact "${outputPath}". Retry with overwrite: true only if replacement is intended.`);
  }

  return withTemporaryDiagram(diagram, ({ directory, input }) => {
    const result = runArchify(
      ['deliver', type, input, outputPath, '--quality', quality, '--json'],
      { capture: true },
    );
    if (result.error) return errorResult(`Could not start the bundled renderer: ${result.error.message}`);
    if (result.status !== 0) {
      return errorResult(sanitizeDiagnostic(result.stderr || result.stdout, directory));
    }
    const receipt = parseJsonOutput(result.stdout, 'Archify delivery');
    receipt.input = '<inline-diagram>';
    return textResult(
      receipt,
      `Rendered ${type} diagram to ${receipt.output}. SHA-256: ${receipt.artifact.sha256}`,
    );
  });
}

export function callTool(name, args = {}) {
  if (!isPlainObject(args)) return errorResult('Tool arguments must be a JSON object.');

  try {
    switch (name) {
      case 'advise_diagram': {
        requireKeys(args, ['task'], ['task']);
        return textResult(advise(requireTask(args.task)));
      }
      case 'create_diagram_plan': {
        requireKeys(args, ['task'], ['task']);
        return textResult(createPlan(requireTask(args.task)));
      }
      case 'review_diagram_plan': {
        requireKeys(args, ['plan'], ['plan']);
        return textResult(reviewPlan(requireObject(args.plan, 'plan')));
      }
      case 'validate_diagram': {
        requireKeys(args, ['type', 'diagram', 'quality'], ['type', 'diagram']);
        return validateDiagram(args);
      }
      case 'render_diagram': {
        requireKeys(
          args,
          ['type', 'diagram', 'outputPath', 'quality', 'overwrite'],
          ['type', 'diagram', 'outputPath'],
        );
        return renderDiagram(args);
      }
      default:
        throw new UnknownToolError(name);
    }
  } catch (error) {
    if (error instanceof UnknownToolError) throw error;
    return errorResult(error.message);
  }
}
