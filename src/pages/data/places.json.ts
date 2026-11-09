/* Search index for the town / ZIP finder: towns, regions and their communities. */
import type { APIRoute } from 'astro';
import { business, url, getTowns, getRegions } from '../../lib/site';

export const GET: APIRoute = async () => {
  const [towns, regions] = await Promise.all([getTowns(), getRegions()]);
  const st = business.address.state;
  const places: { n: string; u: string; t: string; z?: string }[] = [];
  for (const t of towns) {
    places.push({ n: `${t.name}, ${st}`, u: url.town(t.slug), t: `${t.county} County`, z: t.zips.join(' ') });
    for (const n of t.neighborhoods) places.push({ n: `${n}, ${t.name}`, u: url.town(t.slug), t: t.name });
  }
  const seen = new Set(towns.map((t) => t.name));
  for (const r of regions) {
    places.push({ n: r.name, u: url.region(r.slug), t: 'Region' });
    for (const c of r.counties) places.push({ n: `${c} County`, u: url.region(r.slug), t: r.name });
    for (const c of r.communities) if (!seen.has(c)) { seen.add(c); places.push({ n: `${c}, ${st}`, u: url.region(r.slug), t: r.name }); }
  }
  return new Response(JSON.stringify(places), { headers: { 'Content-Type': 'application/json' } });
};
