/**
 * Fills {token} placeholders in content strings from business.json.
 * Add a token here and it becomes usable in every content file.
 *
 * Optional facts (years in business, license number) are only tokens while
 * they have a value. Using one while it is empty fails the build with the
 * offending text, so a blank never slips onto the page.
 */
import business from '../data/business.json';
import { facts } from './facts';

const a = business.address;

export const TOKENS: Record<string, string> = {
  name: business.name,
  legalName: business.legalName,
  shortName: business.shortName,
  phone: business.phone,
  email: business.email,
  city: a.city,
  state: a.stateName,
  stateAbbr: a.state,
  street: a.street,
  zip: a.zip,
  address: `${a.street}, ${a.city}, ${a.state} ${a.zip}`,
  rating: facts.rating,
  reviews: facts.reviews,
  owner: business.owner.name,
  ownerFirst: business.owner.firstName,
  ownerTitle: business.owner.title,
  hours: business.hours.phrase,
  hoursSummary: business.hours.summary,
  ...(facts.years ? { years: String(facts.years) } : {}),
  ...(facts.license ? { license: facts.license } : {}),
};

const RE = /\{(\w+)\}/g;

/** Replace tokens in a single string. Throws on a token with no value. */
export function fillString(s: string, extra: Record<string, string> = {}): string {
  return s.replace(RE, (m, key) => {
    const v = extra[key] ?? TOKENS[key];
    if (v === undefined) {
      throw new Error(`Content uses ${m} but it has no value in business.json. Text: "${s.slice(0, 120)}"`);
    }
    return v;
  });
}

/** Deep-fill every string in an object or array. */
export function fill<T>(value: T, extra: Record<string, string> = {}): T {
  if (typeof value === 'string') return fillString(value, extra) as T;
  if (Array.isArray(value)) return value.map((v) => fill(v, extra)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = fill(v, extra);
    return out as T;
  }
  return value;
}
