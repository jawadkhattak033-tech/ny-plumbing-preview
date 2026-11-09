# Plumbing company site (Astro, static)

Static site for a plumbing company. It builds to plain files for Hostinger `public_html`.

## Commands

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # images + static build into dist/
npm run images   # regenerate image variants only
```

## Swapping in a new business

1. Edit **`src/data/business.json`**: name, address, phone, email, hours, years in business, rating and review count, owner, license number, social links, `siteUrl`, and `formRecipient` (where leads are emailed).
2. Run `npm run build`.

Every page, the schema markup, the OG image, the favicons and the PHP mail config read from that file. Content files use tokens like `{name}`, `{phone}`, `{city}` and `{owner}`, which are filled at build time. The full list is in `src/lib/tokens.ts`.

Town, region and service copy names real New York places directly. A business in another state needs new files in `src/content/towns/` and `src/content/regions/`.

## Where things live

| What | Where |
|---|---|
| Business details | `src/data/business.json` |
| Page copy, one JSON file per page | `src/content/{services,commercial,regions,towns,pages}/` |
| Content schemas (fields required for each page type) | `src/content.config.ts` |
| Writing rules for new content | `CONTENT-BRIEF.md` |
| One layout per page type | `src/layouts/` |
| Shared sections (hero, reviews, FAQ, CTA...) | `src/components/` |
| Reviews (placeholders) | `src/data/reviews.json` |
| Job photo gallery | `src/data/work.json` |
| Fixed image list | `src/data/images.json` |
| Styles | `src/styles/global.css` |
| Client JS (~5 KB) | `src/scripts/main.ts` |
| Form handler | `public/contact-handler.php` |

To add a page, drop a JSON file into the right content folder and rebuild. Service, town and region pages are generated from the files that exist there, and nav, footer, sitemap and the town finder update automatically.

## Images

`npm run images` writes WebP variants at 480/800/1200/1920 widths to `public/images/photos/`. For each image key:

- If `src/assets/photos/<key>.jpg|png|webp` exists, that photo is resized.
- Otherwise a labeled placeholder is drawn.

Keys are `service-<slug>`, `commercial-<slug>`, `region-<slug>`, `town-<slug>`, plus the fixed ones in `src/data/images.json` (`hero-home`, `owner`, `work-01`...). Every `<img>` is lazy loaded with `srcset` and `sizes`, except the hero image.

## Deploying to Hostinger

1. `npm run build`
2. Upload the **contents** of `dist/` into `public_html/`, including the hidden `.htaccess`.
3. The request form posts to `/contact-handler.php`, which uses PHP `mail()`. It sends to `formRecipient` and redirects to `/thank-you/`. It also appends every lead to `form-leads.csv` one folder above `public_html`, so a lead is kept even if mail fails.
4. For reliable delivery, create a mailbox on the domain in Hostinger. The handler sends from `no-reply@<your domain>`.
5. Once SSL is active, uncomment the HTTPS redirect in `.htaccess`.

## Client preview on GitHub Pages

`.github/workflows/preview.yml` builds the site with `PREVIEW=true` on every push to `main` and publishes it to GitHub Pages. The preview build differs from the Hostinger build in these ways only:

- It is served under the repo path (`https://<user>.github.io/<repo>/`). `astro.config.mjs` sets `site` and `base` from the Pages settings and prefixes root-relative links in the built HTML.
- Every page has `<meta name="robots" content="noindex, nofollow">`, and `robots.txt` disallows everything.
- A banner reads "Preview site. Business details are placeholders."
- The request form does not send. Submitting shows a note that the form goes live after hosting is set up. `contact-handler.php`, `contact-config.php` and `.htaccess` are left out.

The workflow builds for https://jawadkhattak033-tech.github.io/ny-plumbing-preview/. To test the same build locally: `PREVIEW=true PREVIEW_SITE=https://jawadkhattak033-tech.github.io PREVIEW_BASE=/ny-plumbing-preview npm run build`, then `npx astro preview` and open `/ny-plumbing-preview/`.

`npm run build` without `PREVIEW` is the Hostinger build and includes none of the above.

## Before launch

- **License number and years in business** are hidden while `licenseNumber` is `""` and `yearsInBusiness` is `null` in `business.json`. Fill them in and they reappear automatically in the trust strip, homepage hero, footer, about page and schema. Page copy no longer mentions them, so add `{years}` or `{license}` to any content where you want them. The build fails if a token is used while its value is empty.
- **Rating and review count** show `[RATING]` and `[REVIEW COUNT]` while they are strings. Set real numbers (e.g. `4.9`, `120`) and they display as "4.9" and "120+".
- **Sample reviews:** replace the entries in `src/data/reviews.json` with real Google reviews (verbatim, with permission), add the date, and set `"sample": false` on each to remove its "Sample review" tag.
- Replace placeholder photos.
- Have the privacy policy and terms reviewed.
- Verify town facts (ZIPs, neighborhood names). They were written as placeholders.
- To enable Google Tag Manager, set `analytics.gtmId`.
