// Diago-owned presentation; the bundled upstream snapshot remains byte-exact.
export const presentationCss = `
[data-theme="dark"][data-theme], :root:not([data-theme]) {
 --bg:#080f20;--panel:#111c30;--mask:#111c30;--text:#f5f8fb;--muted:#91a2b5;
 --line:#28374e;--primary:#ffbe0b;--mint:#6ef3c5;--cyan:#6ca8ff;--amber:#f2d47a;--violet:#b9a4ff;--rose:#ff7f9f;
 --text-muted:var(--muted);--text-dim:#91a2b5;--text-faint:#b8c4d0;
 --grid:#18263c;--canvas-dot:rgba(108,168,255,.12);--panel-border:var(--line);
 --lane-fill:#0d1628;--lane-stroke:#34465a;--arrow:#91a2b5;--arrow-emphasis:var(--mint);
 --toolbar-bg:#111c30;--toolbar-border:#34465a;--toolbar-text:var(--text);--toolbar-hover:#18263c;--toolbar-menu-bg:#0d1628;
 --frontend-stroke:var(--cyan);--backend-stroke:var(--mint);--cloud-stroke:var(--amber);--security-stroke:var(--rose);--messagebus-stroke:#ff9d6c;
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
 color-scheme:light;
}
body {background:var(--bg)}
.diago-brand,.eyebrow {color:var(--primary);font:700 12px/1.5 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}
.diago-brand {display:block;margin-bottom:12px}
html .header h1,html[data-preset] .header h1,html[data-preset] .card h3 {font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
html .toolbar #btn-export {background:#ffbe0b;color:#080f20;border-color:#ffbe0b}
html[data-preset] .pulse-dot {background:var(--primary);border-color:var(--primary)}
.diagram-node:focus-visible rect {stroke:var(--primary)}
.diago-theme {justify-self:start;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--text);padding:8px 12px;font:inherit;cursor:pointer}
.diago-theme:focus-visible {outline:2px solid var(--primary);outline-offset:3px}
`;

export function applyDiagoPresentation(template) {
  if (!template.includes('</head>') || !template.includes('<div class="header">')) {
    throw new Error('Bundled renderer template no longer matches the Diago presentation contract.');
  }
  return template
    .replace('</head>', `<style id="diago-presentation">${presentationCss}</style>\n</head>`)
    .replace('<div class="header">', '<div class="header"><span class="diago-brand">Diago · Engineering workbench</span>');
}

export const nativeThemeScript = `<script>
(function(){
 var root=document.documentElement;
 var requested=new URLSearchParams(location.search).get('theme');
 var theme=requested==='light'||requested==='dark'?requested:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
 root.dataset.theme=theme;
 document.addEventListener('DOMContentLoaded',function(){
  var button=document.querySelector('.diago-theme');
  function sync(){button.textContent=root.dataset.theme==='dark'?'Switch to light theme':'Switch to dark theme';}
  button.addEventListener('click',function(){root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';sync();});
  sync();
 });
})();
</script>`;
