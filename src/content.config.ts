/**
 * Content collections. Every page type reads its copy from one JSON file in
 * src/content/<collection>/. Strings may contain business tokens such as
 * {name}, {phone} or {city}; they are filled from src/data/business.json at
 * build time (see src/lib/tokens.ts), so a new business is a one-file swap.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const hero = z.object({ eyebrow: z.string(), h1: z.string(), sub: z.string() });
const faq = z.object({ q: z.string(), a: z.string() });
const block = z.object({ heading: z.string(), paragraphs: z.array(z.string()).min(1) });

/* Residential and commercial service pages share one schema. */
const serviceSchema = z.object({
  title: z.string(),
  order: z.number(),
  seoTitle: z.string(),
  metaDescription: z.string(),
  imageAlt: z.string(),
  cardText: z.string(),
  hero,
  quickAnswer: z.string(),
  intro: z.array(z.string()).min(2),
  signs: z.object({ heading: z.string(), items: z.array(z.string()).min(4) }),
  covers: z.object({ heading: z.string(), items: z.array(z.string()).min(4) }),
  bookLabel: z.string(),
  process: z.object({
    heading: z.string(),
    steps: z.array(z.object({ title: z.string(), text: z.string() })).length(4),
  }),
  local: block,
  cost: block,
  faqs: z.array(faq).min(4),
  related: z.array(z.string()).length(3),
  ctaHeading: z.string(),
});

const services = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/services' }),
  schema: serviceSchema,
});

const commercial = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/commercial' }),
  schema: serviceSchema,
});

const regions = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/regions' }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    counties: z.array(z.string()).min(1),
    communities: z.array(z.string()).min(4),
    seoTitle: z.string(),
    metaDescription: z.string(),
    imageAlt: z.string(),
    cardText: z.string(),
    hero,
    quickAnswer: z.string(),
    intro: z.array(z.string()).min(2),
    coverage: block,
    problems: z.array(z.object({ title: z.string(), text: z.string() })).length(4),
    faqs: z.array(faq).min(4),
    ctaHeading: z.string(),
  }),
});

const towns = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/towns' }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    county: z.string(),
    region: z.string(),
    zips: z.array(z.string()).min(1),
    neighborhoods: z.array(z.string()).min(3),
    nearby: z.array(z.string()).min(3),
    geo: z.object({ lat: z.number(), lng: z.number() }),
    seoTitle: z.string(),
    metaDescription: z.string(),
    imageAlt: z.string(),
    hero,
    intro: z.string(),
    popular: z.array(z.string()).min(4),
    problems: z
      .array(z.object({ title: z.string(), text: z.string(), service: z.string() }))
      .length(4),
    housing: block,
    howWeWork: block,
    faqs: z.array(faq).min(4),
    ctaHeading: z.string(),
  }),
});

/* One-off pages (home, hubs, about, contact...). Each layout knows its own
   fields, so the schema only enforces the SEO basics. */
const pages = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/pages' }),
  schema: z
    .object({
      seoTitle: z.string(),
      metaDescription: z.string(),
    })
    .passthrough(),
});

export const collections = { services, commercial, regions, towns, pages };
