import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { runArchify } from './archify.mjs';
import { getDiagramType } from './diagram-catalog.mjs';
import { dataModelRenderer } from './renderers/data-model.mjs';
import { timelineRenderer } from './renderers/timeline.mjs';

const nativeRenderers = new Map([
  ['data-model', dataModelRenderer],
  ['timeline', timelineRenderer],
]);

export class RendererExecutionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RendererExecutionError';
  }
}

function withTemporaryDiagram(diagram, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diago-renderer-'));
  const input = path.join(directory, 'diagram.json');
  try {
    fs.writeFileSync(input, `${JSON.stringify(diagram, null, 2)}\n`, { flag: 'wx' });
    return callback({ directory, input });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    throw new RendererExecutionError(`${label} returned an unreadable response.`);
  }
}

function diagnostic(result, directory) {
  if (result.error) return `Could not start the bundled renderer: ${result.error.message}`;
  return String(result.stderr || result.stdout || 'The bundled renderer failed without a diagnostic.')
    .replaceAll(directory, '<temporary-directory>')
    .trim()
    .slice(0, 20_000);
}

function requireArchifySuccess(result, directory) {
  if (result.error || result.status !== 0) {
    throw new RendererExecutionError(diagnostic(result, directory));
  }
}

function unavailable(type) {
  throw new RendererExecutionError(`Native renderer "${type}" is registered but its adapter is unavailable.`);
}

function nativeRenderer(type) {
  const renderer = nativeRenderers.get(type);
  if (!renderer) return unavailable(type);
  return renderer;
}

export function validateDiagramDocument({ type, diagram, quality = 'showcase' }) {
  const renderer = getDiagramType(type);
  if (renderer.engine === 'native') return nativeRenderer(type).validate(diagram);

  return withTemporaryDiagram(diagram, ({ directory, input }) => {
    const result = runArchify(
      ['validate', type, input, '--quality', quality, '--json'],
      { capture: true },
    );
    requireArchifySuccess(result, directory);
    const validation = parseJsonOutput(result.stdout, 'Archify validation');
    validation.input = '<inline-diagram>';
    return validation;
  });
}

export function renderDiagramDocument({ type, diagram, outputPath, quality = 'showcase' }) {
  const renderer = getDiagramType(type);
  if (renderer.engine === 'native') {
    const adapter = nativeRenderer(type);
    const validation = adapter.validate(diagram);
    const html = adapter.render(diagram, quality);
    fs.writeFileSync(outputPath, html);
    return {
      schemaVersion: 1,
      ok: true,
      command: 'deliver',
      type,
      input: '<inline-diagram>',
      output: path.resolve(outputPath),
      artifact: {
        sha256: createHash('sha256').update(html).digest('hex'),
        bytes: Buffer.byteLength(html),
      },
      validation,
    };
  }

  return withTemporaryDiagram(diagram, ({ directory, input }) => {
    const result = runArchify(
      ['deliver', type, input, outputPath, '--quality', quality, '--json'],
      { capture: true },
    );
    requireArchifySuccess(result, directory);
    const receipt = parseJsonOutput(result.stdout, 'Archify delivery');
    receipt.input = '<inline-diagram>';
    return receipt;
  });
}

export function runRendererCommand(command, type, args) {
  const renderer = getDiagramType(type);
  if (renderer.engine !== 'archify') return unavailable(type);
  return runArchify([command, type, ...args]);
}
