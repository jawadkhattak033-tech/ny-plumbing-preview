// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import business from './src/data/business.json' with { type: 'json' };

/* Pages that must never appear in the sitemap. */
const NOINDEX = ['/thank-you/', '/404/'];

/*
 * Two builds from one codebase:
 * - Production (default, `npm run build`): Hostinger, served from the domain root.
 * - Preview (`PREVIEW=true`, set by .github/workflows/preview.yml): GitHub Pages,
 *   served under /<repo>/. Adds noindex, a preview banner and a disabled form,
 *   and leaves out the PHP mail handler and .htaccess.
 * PREVIEW_SITE (e.g. https://user.github.io) and PREVIEW_BASE (e.g. /repo)
 * come from actions/configure-pages in the workflow.
 */
const PREVIEW = process.env.PREVIEW === 'true';
const base = PREVIEW ? (process.env.PREVIEW_BASE || '').replace(/\/+$/, '') : '';
const site = PREVIEW ? (process.env.PREVIEW_SITE || 'https://example.github.io').replace(/\/+$/, '') : business.siteUrl;
/* Absolute URL of the site root (no trailing slash), for canonical, OG and schema. */
const siteRoot = site.replace(/\/+$/, '') + base;

/**
 * Templates write root-relative links ("/plumbing/", "/images/...").
 * Under a base path those must become "/<repo>/plumbing/". Astro prefixes
 * its own bundled assets; this hook prefixes everything else in the built
 * HTML. It only runs for the preview build with a non-empty base.
 */
function prefixBase() {
  return {
    name: 'preview-base-prefix',
    hooks: {
      /** @param {{ dir: URL }} opts */
      'astro:build:done': ({ dir }) => {
        const root = fileURLToPath(dir);
        if (PREVIEW) {
          /* The PHP handler cannot run on GitHub Pages; keep it out of the preview. */
          for (const f of ['contact-handler.php', 'contact-config.php', '.htaccess']) fs.rmSync(path.join(root, f), { force: true });
          fs.writeFileSync(path.join(root, '.nojekyll'), '');
        }
        if (!base) return;
        const fix = (/** @type {string} */ u) => (u.startsWith('/') && !u.startsWith('//') && u !== base && !u.startsWith(base + '/') ? base + u : u);
        const walk = (/** @type {string} */ d) => {
          for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith('.html')) {
              let html = fs.readFileSync(p, 'utf8');
              html = html.replace(/(\s(?:href|src|action|poster|data-index))=(["'])(\/[^"']*)\2/g, (_, attr, q, u) => `${attr}=${q}${fix(u)}${q}`);
              html = html.replace(/(\s(?:href|src|action|poster|data-index))=(\/[^\s>"']*)/g, (_, attr, u) => `${attr}=${fix(u)}`);
              html = html.replace(/(\ssrcset)=(["'])([^"']*)\2/g, (_, attr, q, list) =>
                `${attr}=${q}${list.split(',').map((/** @type {string} */ part) => part.replace(/^(\s*)(\S+)/, (_m, ws, u) => ws + fix(u))).join(',')}${q}`);
              fs.writeFileSync(p, html);
            }
          }
        };
        walk(root);
      },
    },
  };
}

export default defineConfig({
  site,
  base: base || '/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  vite: {
    define: {
      __PREVIEW__: JSON.stringify(PREVIEW),
      __SITE_ROOT__: JSON.stringify(siteRoot),
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX.some((p) => page.endsWith(p)),
    }),
    prefixBase(),
  ],
});
