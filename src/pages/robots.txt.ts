/* robots.txt, generated at build from business.siteUrl. The GitHub Pages preview blocks all crawlers. */
import type { APIRoute } from 'astro';
import { siteUrl, PREVIEW } from '../lib/site';

const lines = PREVIEW
  ? ['User-agent: *', 'Disallow: /', '']
  : ['User-agent: *', 'Allow: /', 'Disallow: /thank-you/', 'Disallow: /contact-handler.php', '', `Sitemap: ${siteUrl}/sitemap-index.xml`, ''];

export const GET: APIRoute = () =>
  new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
