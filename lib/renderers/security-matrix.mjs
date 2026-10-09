import { buildStandaloneHtml, escapeHtml as esc, requireArray, requireDocument, requireEnum, requireUniqueIds, validationReceipt } from './shared.mjs';
import { detailTable, documentFields, label, object, reference, text, uniquePair } from './engineering-shared.mjs';

const LEVELS = ['admin', 'write', 'read', 'none', 'unknown'];
const COLORS = { admin: 'rose', write: 'amber', read: 'cyan', none: 'muted', unknown: 'muted' };

export function validateSecurityMatrix(diagram) {
  requireDocument(diagram, 'security-matrix');
  documentFields(diagram, ['roles', 'resources', 'permissions']);
  const roles = requireArray(diagram.roles, 'roles', { min: 1, max: 6, decomposition: true });
  const resources = requireArray(diagram.resources, 'resources', { min: 1, max: 12, decomposition: true });
  const permissions = requireArray(diagram.permissions, 'permissions', { max: 72 });
  const roleIds = requireUniqueIds(roles, 'roles'), resourceIds = requireUniqueIds(resources, 'resources');
  for (const [name, items] of [['roles', roles], ['resources', resources]]) items.forEach((item, i) => {
    object(item, `${name}[${i}]`, ['id', 'label']);
    text(item.label, `${name}[${i}].label`, 40);
  });
  const pairs = new Set();
  permissions.forEach((permission, i) => {
    const p = `permissions[${i}]`;
    object(permission, p, ['role', 'resource', 'level', 'value', 'evidence']);
    reference(permission.role, roleIds, `${p}.role`); reference(permission.resource, resourceIds, `${p}.resource`);
    uniquePair(pairs, permission.role, permission.resource, p);
    requireEnum(permission.level, LEVELS, `${p}.level`);
    text(permission.value, `${p}.value`, 24);
    text(permission.evidence, `${p}.evidence`, 300);
  });
  return validationReceipt('security-matrix', { roles: roles.length, resources: resources.length, permissions: permissions.length,
    unknown: roles.length * resources.length - permissions.filter(p => p.level !== 'unknown').length });
}

export function renderSecurityMatrix(diagram, quality = 'showcase') {
  const cell = (resource, role) => diagram.permissions.find(p => p.role === role.id && p.resource === resource.id) ?? {
    level: 'unknown', value: 'Unknown', evidence: 'No permission evidence supplied.',
  };
  const width = 220 + diagram.roles.length * 150;
  let svg = label('Resources × roles · color encodes access level, not verification', 24, 28, Math.floor((width - 48) / 6.7));
  diagram.roles.forEach((role, col) => { svg += label(role.label, 220 + col * 150 + 65, 60, 16, 'node-copy', 'middle'); });
  diagram.resources.forEach((resource, row) => {
    const y = 124 + row * 90;
    svg += label(resource.label, 24, y + 30, 22);
    diagram.roles.forEach((role, col) => {
      const p = cell(resource, role), x = 210 + col * 150;
      svg += `<g role="img" aria-label="${esc(`${resource.label}; ${role.label}; ${p.level}: ${p.value}. ${p.evidence}`)}"><title>${esc(p.evidence)}</title><rect x="${x}" y="${y}" width="136" height="78" rx="9" fill="var(--${COLORS[p.level]})" fill-opacity=".09" stroke="var(--line)" ${p.level === 'unknown' ? 'stroke-dasharray="3 5"' : ''}/>${label(p.value, x + 12, y + 23, 17)}<text class="node-key" style="fill:var(--${COLORS[p.level]})" x="${x + 12}" y="${y + 65}">${p.level}</text></g>`;
    });
  });
  let y = 30, mobileSvg = '';
  for (const resource of diagram.resources) {
    mobileSvg += label(resource.label, 20, y, 30, 'node-title'); y += 56;
    for (const role of diagram.roles) {
      const p = cell(resource, role);
      mobileSvg += `<g role="img" aria-label="${esc(`${resource.label}; ${role.label}; ${p.level}: ${p.value}. ${p.evidence}`)}"><rect x="16" y="${y - 18}" width="288" height="105" rx="8" fill="var(--${COLORS[p.level]})" fill-opacity=".08"/>${label(role.label, 28, y, 30)}${label(`${p.level}: ${p.value}`, 28, y + 46, 32)}</g>`;
      y += 115;
    }
    y += 20;
  }
  const rows = diagram.resources.flatMap(resource => diagram.roles.map(role => {
    const p = cell(resource, role); return [resource.label, role.label, `${p.level}: ${p.value}`, p.evidence];
  }));
  return buildStandaloneHtml({ type: 'security-matrix', title: diagram.meta.title, subtitle: diagram.meta.subtitle, quality,
    description: 'An access review of authored permissions, not a policy evaluator. Missing cells are unknown, never a deny decision. The permission register contains complete values and sources.',
    width, height: 144 + diagram.resources.length * 90, svg,
    mobile: { width: 320, height: y, svg: mobileSvg },
    legend: LEVELS.map(level => `<span><i style="background:var(--${COLORS[level]})"></i>${level}</span>`).join(''),
    details: detailTable('Permission register', ['Resource', 'Role', 'Permission', 'Evidence'], rows),
  });
}

export const securityMatrixRenderer = Object.freeze({ validate: validateSecurityMatrix, render: renderSecurityMatrix });
