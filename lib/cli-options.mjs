function optionValue(args, index, name) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
}

export function parseContextArgs(args, { allowOutput = false } = {}) {
  const positional = [];
  const context = {};
  let json = false;
  let output = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      json = true;
    } else if (arg === '--source') {
      context.sourceKind = optionValue(args, index, '--source');
      index += 1;
    } else if (arg === '--audience') {
      context.audienceDetail = optionValue(args, index, '--audience');
      index += 1;
    } else if (arg === '--destination') {
      context.destination = optionValue(args, index, '--destination');
      index += 1;
    } else if (arg === '--out' && allowOutput) {
      output = optionValue(args, index, '--out');
      index += 1;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option "${arg}".`);
    } else {
      positional.push(arg);
    }
  }

  return { positional, context, json, output };
}

export function parseNativeOptions(args) {
  const positional = [];
  let quality = 'showcase';
  let json = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--quality') {
      quality = optionValue(args, index, '--quality');
      index += 1;
    } else if (arg === '--json') {
      json = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown native renderer option "${arg}".`);
    } else {
      positional.push(arg);
    }
  }

  if (!['standard', 'showcase'].includes(quality)) {
    throw new Error('quality must be standard or showcase.');
  }
  return { positional, quality, json };
}
