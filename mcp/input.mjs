import { DIAGRAM_TYPES } from '../lib/diagram-catalog.mjs';

const QUALITY_PROFILES = ['standard', 'showcase'];
const SOURCE_KINDS = ['prompt', 'repository', 'conversation', 'mixed'];
const AUDIENCE_DETAILS = ['technical', 'mixed', 'executive'];
const MAX_TASK_LENGTH = 10_000;
const MAX_DIAGRAM_BYTES = 2_000_000;

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function requireObject(value, name) {
  if (!isPlainObject(value)) throw new TypeError(`${name} must be a JSON object.`);
  const bytes = Buffer.byteLength(JSON.stringify(value));
  if (bytes > MAX_DIAGRAM_BYTES) {
    throw new TypeError(`${name} is too large. The limit is ${MAX_DIAGRAM_BYTES} bytes.`);
  }
  return value;
}

export function requireKeys(args, allowed, required) {
  const unknown = Object.keys(args).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw new TypeError(`Unknown argument${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}.`);
  }
  const missing = required.filter((key) => !(key in args));
  if (missing.length) {
    throw new TypeError(`Missing required argument${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`);
  }
}

export function requireTask(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('task must be a non-empty string.');
  }
  if (value.length > MAX_TASK_LENGTH) {
    throw new TypeError(`task is too long. The limit is ${MAX_TASK_LENGTH} characters.`);
  }
  return value.trim();
}

export function requireType(value) {
  if (!DIAGRAM_TYPES.includes(value)) {
    throw new TypeError(`type must be one of: ${DIAGRAM_TYPES.join(', ')}.`);
  }
  return value;
}

export function requireQuality(value) {
  const quality = value ?? 'showcase';
  if (!QUALITY_PROFILES.includes(quality)) {
    throw new TypeError(`quality must be one of: ${QUALITY_PROFILES.join(', ')}.`);
  }
  return quality;
}

export function requireContext(args) {
  const sourceKind = args.sourceKind ?? 'prompt';
  const audienceDetail = args.audienceDetail ?? 'technical';
  const destination = args.destination ?? 'engineering-review';
  if (!SOURCE_KINDS.includes(sourceKind)) {
    throw new TypeError(`sourceKind must be one of: ${SOURCE_KINDS.join(', ')}.`);
  }
  if (!AUDIENCE_DETAILS.includes(audienceDetail)) {
    throw new TypeError(`audienceDetail must be one of: ${AUDIENCE_DETAILS.join(', ')}.`);
  }
  if (typeof destination !== 'string' || !destination.trim()) {
    throw new TypeError('destination must be a non-empty string.');
  }
  return { sourceKind, audienceDetail, destination: destination.trim() };
}
