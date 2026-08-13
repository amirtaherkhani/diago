import { listDiagramTypes } from '../lib/diagram-catalog.mjs';
import { createPlan } from '../lib/planner.mjs';
import { advise } from '../lib/recommender.mjs';
import { renderDiagramDocument, validateDiagramDocument } from '../lib/renderer-registry.mjs';
import { reviewPlan } from '../lib/reviewer.mjs';
import { prepareOutputPath } from './artifacts.mjs';
import { TOOL_DEFINITIONS } from './contracts.mjs';
import {
  isPlainObject,
  requireContext,
  requireKeys,
  requireObject,
  requireQuality,
  requireTask,
  requireType,
} from './input.mjs';

export { TOOL_DEFINITIONS };

export class UnknownToolError extends Error {
  constructor(name) {
    super(`Unknown tool: ${name}`);
    this.name = 'UnknownToolError';
  }
}

function textResult(data, summary) {
  const serialized = JSON.stringify(data, null, 2);
  return {
    content: [{ type: 'text', text: summary ? `${summary}\n\n${serialized}` : serialized }],
    structuredContent: data,
    isError: false,
  };
}

function errorResult(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function diagramArguments(args) {
  return {
    type: requireType(args.type),
    diagram: requireObject(args.diagram, 'diagram'),
    quality: requireQuality(args.quality),
  };
}

function validateDiagram(args) {
  return textResult(validateDiagramDocument(diagramArguments(args)));
}

function renderDiagram(args) {
  const output = prepareOutputPath(args.outputPath, args.overwrite);
  if (!output.ok) return errorResult(output.message);
  const receipt = renderDiagramDocument({
    ...diagramArguments(args),
    outputPath: output.outputPath,
  });
  return textResult(
    receipt,
    `Rendered ${receipt.type} diagram to ${receipt.output}. SHA-256: ${receipt.artifact.sha256}`,
  );
}

export function callTool(name, args = {}) {
  if (!isPlainObject(args)) return errorResult('Tool arguments must be a JSON object.');

  try {
    switch (name) {
      case 'list_diagram_types':
        requireKeys(args, [], []);
        return textResult({ schemaVersion: 1, types: listDiagramTypes() });
      case 'advise_diagram':
        requireKeys(args, ['task', 'sourceKind', 'audienceDetail', 'destination'], ['task']);
        return textResult(advise(requireTask(args.task), requireContext(args)));
      case 'create_diagram_plan':
        requireKeys(args, ['task', 'sourceKind', 'audienceDetail', 'destination'], ['task']);
        return textResult(createPlan(requireTask(args.task), requireContext(args)));
      case 'review_diagram_plan':
        requireKeys(args, ['plan'], ['plan']);
        return textResult(reviewPlan(requireObject(args.plan, 'plan')));
      case 'validate_diagram':
        requireKeys(args, ['type', 'diagram', 'quality'], ['type', 'diagram']);
        return validateDiagram(args);
      case 'render_diagram':
        requireKeys(args, ['type', 'diagram', 'outputPath', 'quality', 'overwrite'], ['type', 'diagram', 'outputPath']);
        return renderDiagram(args);
      default:
        throw new UnknownToolError(name);
    }
  } catch (error) {
    if (error instanceof UnknownToolError) throw error;
    return errorResult(error instanceof Error ? error.message : 'Tool execution failed.');
  }
}
