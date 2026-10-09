import { arrowAssets } from '../arrows.mjs';
import { diagoLogoCss, diagoLogoMarkup } from '../brand.mjs';
import { walkthroughAssets } from './walkthrough.mjs';
import { themeControl, themeControlCss } from './theme-control.mjs';
// Diago-owned presentation; the bundled upstream snapshot remains byte-exact.
export const presentationCss = `${themeControlCss}
${diagoLogoCss}

[data-theme="dark"][data-theme], :root:not([data-theme]) {
 --bg:#080f20;--panel:#111c30;--mask:#111c30;--text:#f5f8fb;--muted:#91a2b5;
 --line:#28374e;--primary:#ffbe0b;--mint:#6ef3c5;--cyan:#6ca8ff;--amber:#f2d47a;--violet:#b9a4ff;--rose:#ff7f9f;
 --text-muted:var(--muted);--text-dim:#91a2b5;--text-faint:#b8c4d0;
 --grid:#18263c;--canvas-dot:rgba(108,168,255,.12);--panel-border:var(--line);
 --lane-fill:#0d1628;--lane-stroke:#34465a;--arrow:#91a2b5;--arrow-emphasis:var(--mint);
 --toolbar-bg:#111c30;--toolbar-border:#34465a;--toolbar-text:var(--text);--toolbar-hover:#18263c;--toolbar-menu-bg:#0d1628;
 --frontend-stroke:var(--cyan);--backend-stroke:var(--mint);--cloud-stroke:var(--amber);--security-stroke:var(--rose);--messagebus-stroke:#ff9d6c;
 --pastel-blue:rgba(186,215,239,.035);--pastel-lilac:rgba(220,205,238,.025);--soft-shadow:0 3px 12px rgba(186,205,230,.055);
 color-scheme:dark;
}
[data-theme="light"][data-theme] {
 --bg:#f3f5fa;--panel:#fff;--mask:#fff;--text:#152039;--muted:#53637c;
 --line:#d7dfeb;--primary:#936600;--mint:#157254;--cyan:#285eb6;--amber:#946200;--violet:#7546ad;--rose:#b32d53;
 --text-muted:var(--muted);--text-dim:#53637c;--text-faint:#53637c;
 --grid:#e6ebf3;--canvas-dot:#d7dfeb;--panel-border:var(--line);
 --lane-fill:#f9faff;--lane-stroke:#b2bfd1;--arrow:#53637c;--arrow-emphasis:var(--mint);
 --toolbar-bg:#fff;--toolbar-border:#d7dfeb;--toolbar-text:var(--text);--toolbar-hover:#f3f5fa;--toolbar-menu-bg:#fff;
 --frontend-stroke:var(--cyan);--backend-stroke:var(--mint);--cloud-stroke:var(--amber);--security-stroke:var(--rose);--messagebus-stroke:#a94b19;
 --pastel-blue:rgba(186,215,239,.12);--pastel-lilac:rgba(220,205,238,.09);--soft-shadow:0 3px 12px rgba(166,188,218,.12);
 color-scheme:light;
}
body {background:var(--bg)}
/* Uniform low-intensity decoration across presets; semantic strokes remain intact. */
html[data-preset] body {background-image:none!important}
html[data-preset] .diagram-container,html[data-preset] .card,.canvas {
 background:linear-gradient(135deg,var(--pastel-blue),var(--pastel-lilac)),var(--panel)!important;
 box-shadow:none!important;
}
html .toolbar-group::before,html .toolbar button::before,html .toolbar button::after,
html .pulse-dot,html .card-dot,html .semantic-lens-swatch,html .motion-control-dot,
html .header-row::after,html .overview-map-live,html .diagram-guide-stats::before,
html .semantic-passport-evidence-status::before,html .route-probe-node[aria-current="step"] {box-shadow:none!important}
html .diagram-nav,html .overview-map,html .overview-map-feedback,html .semantic-lens,
html .route-probe,html .focus-chip,html .diagram-guide,html .node-finder,
html .reader-rail,html .rail-reveal,html .preset-menu,html .export-menu,html .archify-toast {
 background:var(--panel)!important;box-shadow:var(--soft-shadow)!important;
}
svg [data-node-id],svg [data-node-id] > rect,svg [data-edge-from],svg [data-focus-selected],
svg .semantic-flow-token,svg .relationship-flow-pulse,svg .route-probe-flow,svg .route-journey-flow,
svg [data-relationship-preview],svg [data-route-journey-current],
.diagram-node:hover rect,.diagram-node:focus-visible rect {filter:none!important}

.diago-brand,.eyebrow {color:var(--primary);font:700 12px/1.5 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}
.diago-brand {display:flex;align-items:center;gap:8px;margin-bottom:12px}
html .header h1,html[data-preset] .header h1,html[data-preset] .card h3 {font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
/* One painted surface; suppress upstream decorative layers and inset focus ring. */
html .toolbar #btn-export {background:#ffbe0b;color:#080f20;border:0;box-shadow:none;outline:none;border-radius:11px}
html .toolbar #btn-export:hover,
html .toolbar #btn-export[aria-expanded="true"] {background:#ffd24d;color:#080f20}
html .toolbar #btn-export::before,
html .toolbar #btn-export::after {content:none;display:none;box-shadow:none}
html .toolbar #btn-export:focus-visible {outline:none;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
html[data-preset] .pulse-dot {background:var(--primary);border-color:var(--primary)}
.diagram-node:focus-visible rect {stroke:var(--primary)}
`;

export function applyDiagoPresentation(template, type = 'architecture') {
  if (!template.includes('</head>') || !template.includes('<div class="header">')) {
    throw new Error('Bundled renderer template no longer matches the Diago presentation contract.');
  }
  return template
    .replace('</body>', `${arrowAssets(type)}\n${walkthroughAssets()}\n</body>`)
    .replace(/<button id="btn-theme"[\s\S]*?<\/button>/, themeControl())
    .replace('</head>', `<style id="diago-presentation">${presentationCss}</style>\n</head>`)
    .replace('<div class="header">', `<div class="header"><span class="diago-brand">${diagoLogoMarkup}<span>Diago · Engineering workbench</span></span>`);
}

export const nativeThemeScript = `<script>
(function(){
 var root=document.documentElement;
 var requested=new URLSearchParams(location.search).get('theme');
 var theme=requested==='light'||requested==='dark'?requested:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
 root.dataset.theme=theme;
 document.addEventListener('DOMContentLoaded',function(){
  var button=document.querySelector('.diago-theme');
  function sync(){button.setAttribute('aria-pressed', String(root.dataset.theme==='light'));}
  button.addEventListener('click',function(){root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';sync();});
  sync();
 });
})();
</script>`;

// Scale the viewport, not the polygon: viewBox preserves the tip and avoids clipping.
export function compactArchifyMarkers(source) {
 const original = 'markerWidth="10" markerHeight="7" refX="9" refY="3.5"';
 if (!source.includes(original)) throw new Error('Bundled arrow marker contract changed.');
 return source.replaceAll(original, 'viewBox="0 0 10 7" markerWidth="7.5" markerHeight="5.25" refX="9" refY="3.5"');
}
