# Search and answer-engine visibility

This checklist covers Diago's public site and repository. Search visibility and citations require discovery, indexing, and useful content; publishing these changes alone does not establish a ranking or traffic gain.

## Search intent and destination

| Reader's question | Destination | Useful answer |
| --- | --- | --- |
| What is Diago? | [Homepage](https://amirtaherkhani.github.io/diago/) | Product definition, audience, diagram views, demo |
| How do I create architecture diagrams with Codex or Claude Code? | [Getting started](https://amirtaherkhani.github.io/diago/guide/) | Plugin installation, exact prompts, runnable example, review steps |
| Does this MCP diagram tool run locally? | [FAQ](https://amirtaherkhani.github.io/diago/#local-setup) | Node.js, stdio transport, agent account requirements |
| What has shipped? | [Releases](https://github.com/amirtaherkhani/diago/releases) | Published features versus source-only features |
| Can I adapt the source? | [Repository](https://github.com/amirtaherkhani/diago) | MIT license, example JSON, contribution instructions |

## Publishing rules

- Keep page titles, descriptions, social previews, and visible product facts consistent.
- Keep essential answers and install commands in the delivered HTML. Use ordinary links between the homepage, guide, repository, examples, and releases.
- Structured data describes the visible website, source project, and guide. Do not invent reviews, ratings, usage counts, or endorsements.
- Update `sitemap.xml` when a public HTML page is added or meaningfully changed. Its dates should reflect content changes, not every deployment.
- Keep the guide's visible update date and structured-data date aligned.
- Update the FAQ and guide release notes when a new plugin version ships. Diago v0.7.0 includes all seven MCP tools, including evidence workflow planning.
- Run `npm run check` before publishing; the discovery checks cover canonical URLs, metadata, schema parsing, sitemap entries, and local links.
- Match GitHub description and topics to the product. Use relevant terms such as `mcp`, `model-context-protocol`, `codex`, `claude-code`, and `architecture-diagrams`.

Google applies ordinary SEO fundamentals to AI Overviews and AI Mode. It does not require special AI files or schema. Clear, useful text and matching structured data support eligibility; inclusion is not guaranteed. [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

## One-time indexing setup

The deployed site is a project under `https://amirtaherkhani.github.io/diago/`.

1. Add that exact **URL-prefix property** in Google Search Console. Use the verification method it provides; for an HTML verification file, place the exact file under `docs/` and deploy it. Keep the file after verification.
2. Add the project URL to Bing Webmaster Tools and complete its ownership verification, or import an already verified Search Console property.
3. Submit `https://amirtaherkhani.github.io/diago/sitemap.xml` in both services.
4. Inspect the homepage and `/diago/guide/`. Check the fetched canonical, indexing eligibility, and actual indexing status before requesting indexing for the changed pages.
5. Record the starting metrics. Site publication, sitemap acceptance, and indexing are separate states.

`docs/robots.txt` is served at `/diago/robots.txt`; crawlers apply the file at the **host root**, `/robots.txt`. The host-root request returned HTTP 404 during the October 8, 2026 review. This is not evidence that the project is blocked or indexed. This repository cannot establish host-wide rules: use the verified sitemap submission above. If a host-root site is managed separately, its owner can add a sitemap reference without changing unrelated crawl rules. [Google robots.txt location guidance](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt).

Google ignores sitemap `priority` and `changefreq`; keep accurate URLs and modification dates. [Google sitemap guidance](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping).

## Measure the next improvement

Compare complete, equivalent periods, starting with a 28-day baseline once data exists. Avoid claiming an improvement from a single impression or isolated generated answer.

| Surface | Record | Decision |
| --- | --- | --- |
| Google Search Console | Indexed URLs, queries, impressions, clicks, CTR | Improve the page that matches a real query; resolve indexing issues first |
| Bing Webmaster Tools | Indexed URLs, search performance, AI citations where reported | Identify which examples or answers get referenced |
| GitHub Insights | Visits, clones, referrers, stars, forks, useful issues | Improve the path from first visit to first successful diagram |
| User feedback | Setup failures and repeated questions | Add concrete answers and reproducible examples |

Google includes its AI-search traffic in the Search Console Web report; it is not a standalone AEO score. Bing's AI Performance report can provide citation data where available. [Google measurement guidance](https://developers.google.com/search/docs/appearance/ai-features#measuring-performance), [Bing AI Performance](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c).

The next content addition should solve one real engineering question, with a prompt, source JSON, diagram, and review notes. Link it from the relevant guide section. Share only in communities that welcome the example, and measure useful visits and contributions as well as stars. [GitHub topic guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).
