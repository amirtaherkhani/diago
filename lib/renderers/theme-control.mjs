// One theme control for native, upstream-backed, and explorer output.
export function themeControl(id = 'btn-theme') {
  return `<button id="${id}" class="diago-theme" type="button" aria-label="Toggle color theme" title="Toggle color theme" aria-pressed="false"><span class="diago-theme-track" aria-hidden="true"><span class="diago-theme-thumb"></span></span><span id="theme-icon" hidden></span><span id="theme-label" hidden>Dark</span></button>`;
}

export const themeControlCss = `
button.diago-theme {position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:56px!important;min-width:56px!important;height:44px!important;min-height:44px!important;padding:0!important;border:0!important;border-radius:10px!important;background:transparent!important;box-shadow:none!important;cursor:pointer}
button.diago-theme::before,button.diago-theme::after {content:none!important;display:none!important}
.diago-theme-track {display:block;width:42px;height:20px;border-radius:999px;background:color-mix(in srgb,var(--text) 9%,transparent)}
.diago-theme-thumb {display:block;position:relative;width:18px;height:18px;top:1px;left:23px;border-radius:50%;background:#3b4a63;color:#c7d2fe;transition:left .18s ease}
.diago-theme-thumb::after {content:'☾';display:block;font:14px/18px system-ui,sans-serif;text-align:center}
button.diago-theme[aria-pressed="true"] .diago-theme-thumb {left:1px;background:var(--panel);color:#936600}
button.diago-theme[aria-pressed="true"] .diago-theme-thumb::after {content:'☀'}
button.diago-theme:hover .diago-theme-track {background:color-mix(in srgb,var(--text) 13%,transparent)}
button.diago-theme:focus-visible {outline:2px solid var(--text)!important;outline-offset:2px}
.diago-theme-group {display:flex;align-items:center;padding:0 4px;border:1px solid var(--line);border-radius:11px;background:var(--panel)}
.diago-native-tools {position:absolute;top:32px;right:clamp(16px,4vw,56px)}
main.diago-native {position:relative}main.diago-native header {padding-right:84px}
@media(max-width:760px){.diago-native-tools{position:static;display:flex;justify-content:flex-end;margin-bottom:16px}main.diago-native header{padding-right:0}}
@media(prefers-reduced-motion:reduce){.diago-theme-thumb{transition:none}}
@media print{.diago-native-tools{display:none}}
`;
