/**
 * Shared data access: business details, URLs and sorted, token-filled
 * collections. Layouts and components import from here, never from raw files.
 */
import { getCollection, getEntry } from 'astro:content';
import business from '../data/business.json';
import fixedImages from '../data/images.json';
import { fill } from './tokens';
export { facts } from './facts';

export { business };

export const tel = `tel:${business.phoneE164}`;
export const a = business.address;
export const fullAddress = `${a.street}, ${a.city}, ${a.state} ${a.zip}`;
export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${fullAddress}`)}`;
export const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
/* business.siteUrl on the production build; the GitHub Pages URL (with repo path) on the preview. */
export const siteUrl = __SITE_ROOT__.replace(/\/$/, '');
export const PREVIEW = __PREVIEW__;
export const absUrl = (path: string) => siteUrl + path;

export const url = {
  service: (slug: string) => `/plumbing/${slug}/`,
  commercial: (slug: string) => `/commercial/${slug}/`,
  region: (slug: string) => `/regions/${slug}/`,
  town: (slug: string) => `/${slug}/`,
};

const byOrder = <T extends { data: { order: number } }>(x: T[]) =>
  x.sort((p, q) => p.data.order - q.data.order);

export async function getServices() {
  return byOrder(await getCollection('services')).map((e) => ({ slug: e.id, ...fill(e.data) }));
}
export async function getCommercial() {
  return byOrder(await getCollection('commercial')).map((e) => ({ slug: e.id, ...fill(e.data) }));
}
export async function getRegions() {
  return byOrder(await getCollection('regions')).map((e) => ({ slug: e.id, ...fill(e.data) }));
}
export async function getTowns() {
  return byOrder(await getCollection('towns')).map((e) => ({ slug: e.id, ...fill(e.data) }));
}
export async function getPage(id: string): Promise<Record<string, any>> {
  const e = await getEntry('pages', id);
  if (!e) throw new Error(`Missing content file src/content/pages/${id}.json`);
  return fill(e.data as Record<string, any>);
}

/** Resolve a service slug from either collection to {title, href}. */
export async function serviceLink(slug: string) {
  const [s, c] = await Promise.all([getServices(), getCommercial()]);
  const r = s.find((x) => x.slug === slug);
  if (r) return { title: r.title, href: url.service(slug) };
  const k = c.find((x) => x.slug === slug);
  if (k) return { title: k.title, href: url.commercial(slug) };
  throw new Error(`Unknown service slug "${slug}"`);
}

/** Image keys follow one convention so content files never name images. */
export const img = {
  service: (slug: string) => `service-${slug}`,
  commercial: (slug: string) => `commercial-${slug}`,
  region: (slug: string) => `region-${slug}`,
  town: (slug: string) => `town-${slug}`,
};

/** Alt text for a fixed image (src/data/images.json), so the photo and its description live together. */
export function imgAlt(key: string): string {
  const e = (fixedImages as Record<string, { alt?: string; label?: string }>)[key];
  if (!e?.alt) throw new Error(`No alt text for image "${key}" in src/data/images.json`);
  return e.alt;
}

/** Top towns featured in the Service Areas dropdown. */
export const FEATURED_TOWNS = ['albany-ny', 'schenectady-ny', 'clifton-park-ny', 'saratoga-springs-ny', 'glens-falls-ny'];
