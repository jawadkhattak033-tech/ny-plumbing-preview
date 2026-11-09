/**
 * Display values for facts the client may not have supplied yet.
 * - rating / reviewCount: a number renders normally ("4.9", "120+");
 *   a string such as "[RATING]" renders as-is, as a visible placeholder.
 * - yearsInBusiness / licenseNumber: null or "" hides them everywhere
 *   (trust strip, hero, footer, about page, schema).
 */
import business from '../data/business.json';

const rating = business.rating as number | string;
const reviewCount = business.reviewCount as number | string;
const years = business.yearsInBusiness as number | null;
const license = business.licenseNumber as string;

export const facts = {
  rating: typeof rating === 'number' ? rating.toFixed(1) : String(rating),
  reviews: typeof reviewCount === 'number' ? `${reviewCount}+` : String(reviewCount),
  /** True while rating/count are placeholders rather than real numbers. */
  ratingIsPlaceholder: typeof rating !== 'number',
  years: years && years > 0 ? years : null,
  license: license?.trim() ? license.trim() : null,
};
