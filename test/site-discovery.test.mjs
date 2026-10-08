import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fromRoot } from '../lib/paths.mjs';

const base = 'https://amirtaherkhani.github.io/diago/';
const pages = [
  { file: 'index.html', url: base },
  { file: 'guide/index.html', url: `${base}guide/` },
].map((page) => ({ ...page, html: fs.readFileSync(fromRoot('docs', page.file), 'utf8') }));
const structuredData = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('public pages have unique titles, descriptions, canonical URLs, and share metadata', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const { html, url } of pages) {
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    const description = html.match(/name="description"\s+content="([^"]+)"/)[1];
    assert.ok(title.includes('Diago'));
    assert.ok(description.length > 80);
    titles.add(title);
    descriptions.add(description);
    assert.equal(html.match(/rel="canonical" href="([^"]+)"/)[1], url);
    assert.equal(html.match(/property="og:url" content="([^"]+)"/)[1], url);
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    assert.match(html, /name="robots" content="index, follow, max-image-preview:large"/);
    assert.doesNotMatch(html, /noindex|nosnippet/);
    for (const property of ['og:title', 'og:description', 'og:image', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
      assert.match(html, new RegExp(`(?:name|property)="${property}" content="[^"]+"`));
    }
  }
  assert.equal(titles.size, pages.length);
  assert.equal(descriptions.size, pages.length);
});

test('structured data links the website, visible product, and authored guide', () => {
  const home = structuredData(pages[0].html);
  const guide = structuredData(pages[1].html);
  assert.equal(home['@context'], 'https://schema.org');
  assert.equal(guide['@context'], 'https://schema.org');
  const byType = (graph, type) => graph['@graph'].find((node) => node['@type'] === type);
  const website = byType(home, 'WebSite');
  const source = byType(home, 'SoftwareSourceCode');
  const page = byType(home, 'WebPage');
  const author = byType(home, 'Person');
  const article = byType(guide, 'TechArticle');
  assert.equal(website.url, base);
  assert.equal(page.mainEntity['@id'], source['@id']);
  assert.equal(source.author['@id'], author['@id']);
  assert.equal(source.codeRepository, 'https://github.com/amirtaherkhani/diago');
  assert.equal(article.about['@id'], source['@id']);
  assert.equal(article.isPartOf['@id'], website['@id']);
  assert.equal(article.author.name, author.name);
  assert.ok(pages[1].html.includes(`<time datetime="${article.dateModified}">`));
  assert.deepEqual(byType(guide, 'BreadcrumbList').itemListElement.map((item) => item.item), pages.map((page) => page.url));
});

test('FAQ answers and all setup options are present in static HTML', () => {
  const home = pages[0].html;
  const guide = pages[1].html.replace(/<script[\s\S]*?<\/script>/g, '');
  assert.match(home, /id="faq"/);
  assert.match(home, /What is Diago\?/);
  assert.match(home, /Model Context Protocol/);
  assert.match(home, /not yet in that release/);
  assert.match(guide, /codex plugin add diago@diago/);
  assert.match(guide, /\/plugin install diago@diago/);
  assert.match(guide, /node bin\/diago.mjs render architecture/);
  assert.match(guide, /does not inspect an arbitrary repository/);
});

test('public page links and assets resolve within the project Pages base path', () => {
  for (const { html, url } of pages) {
    for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = new URL(reference.replaceAll('&amp;', '&'), url);
      if (target.origin !== new URL(base).origin) continue;
      assert.ok(target.href.startsWith(base), `Link escapes the project base: ${reference}`);
      const relative = decodeURIComponent(target.pathname.slice(new URL(base).pathname.length));
      const file = fromRoot('docs', relative.endsWith('/') || !relative ? `${relative}index.html` : relative);
      assert.ok(fs.existsSync(file), `Missing local target: ${reference}`);
      if (target.hash && path.extname(file) === '.html') {
        const targetHtml = fs.readFileSync(file, 'utf8');
        assert.ok(targetHtml.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `Missing anchor: ${reference}`);
      }
    }
  }
});

test('sitemap lists canonical public pages with actual content dates', () => {
  const sitemap = fs.readFileSync(fromRoot('docs', 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls, pages.map((page) => page.url));
  const dates = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
  assert.equal(dates.length, pages.length);
  assert.ok(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date))));
  assert.equal(dates[1], structuredData(pages[1].html)['@graph'][0].dateModified);
  assert.doesNotMatch(sitemap, /<priority>|<changefreq>/);
});

test('both public footers group accessible social logos with the footer navigation', () => {
  const profiles = [
    ['https://x.com/amirmo_th', 'Amir on X', 'x'],
    ['https://hashnode.com/@amirtaherkhani', 'Amir on Hashnode', 'hashnode'],
    ['https://dev.to/amirtaherkhani', 'Amir on DEV', 'devdotto'],
  ];
  const sprite = fs.readFileSync(fromRoot('docs', 'assets', 'social-icons.svg'), 'utf8');
  for (const { html, url: pageUrl } of pages) {
    const footer = html.match(/<footer>([\s\S]*?)<\/footer>/)[1];
    assert.match(footer, /<div class="footer-links">\s*<nav class="footer-nav"[\s\S]*?<\/nav>\s*<nav class="footer-socials"/);
    assert.doesNotMatch(footer, /Follow Amir|section-shell footer-socials/);
    const socials = footer.match(/<nav class="footer-socials" aria-label="Author social profiles">([\s\S]*?)<\/nav>/)[1];
    const links = [...socials.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/g)];
    assert.equal(links.length, profiles.length);
    for (const [url, label, icon] of profiles) {
      const link = links.find(([, attributes]) => attributes.includes(`href="${url}"`));
      assert.ok(link, `Missing footer social link: ${url}`);
      assert.ok(link[1].includes(`aria-label="${label}"`));
      assert.ok(link[1].includes(`title="${label}"`));
      assert.match(link[2], /<svg[^>]+aria-hidden="true"[^>]+focusable="false"/);
      const reference = link[2].match(/<use href="([^"]+)"/)[1];
      assert.equal(new URL(reference, pageUrl).href, `${base}assets/social-icons.svg#${icon}`);
      assert.ok(sprite.includes(`<symbol id="${icon}" viewBox="0 0 24 24"><path d="`));
    }
  }
});
