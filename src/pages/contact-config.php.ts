/**
 * Writes dist/contact-config.php from business.json so the PHP mail handler
 * never needs editing. PHP executes it on the server, so it is never served
 * as text.
 */
import type { APIRoute } from 'astro';
import { business, siteUrl } from '../lib/site';

export const GET: APIRoute = () => {
  const cfg = {
    to: business.formRecipient,
    business: business.name,
    phone: business.phone,
    fromDomain: new URL(siteUrl).hostname.replace(/^www\./, ''),
    thankYou: '/thank-you/',
  };
  const json = JSON.stringify(cfg).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return new Response(`<?php\n// Generated at build from src/data/business.json. Do not edit.\nreturn json_decode('${json}', true);\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
