import fs from 'node:fs';
import { fromRoot } from './paths.mjs';

const source = fs.readFileSync(fromRoot('assets/logo.svg'), 'utf8');
const scalableSource = source.replace(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"',
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"',
);
if (scalableSource === source) throw new Error('The Diago logo SVG does not match its expected asset contract.');
const embeddedLogo = Buffer.from(scalableSource).toString('base64');
export const diagoLogoMarkup = `<img class="diago-logo" src="data:image/svg+xml;base64,${embeddedLogo}" alt="" aria-hidden="true">`;

export const diagoLogoCss = `.diago-logo{display:block;width:28px;height:28px;flex:0 0 28px}`;
