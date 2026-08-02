import { RATING_BANDS } from '@/config/constants';

/**
 * Computes Codeforces-style rank band title dynamically from actual rating.
 * Rating bands are defined as:
 * - >= 2100: Master
 * - 1900-2099: Candidate Master
 * - 1600-1889: Expert
 * - 1400-1599: Specialist
 * - 1200-1399: Pupil
 * - < 1200: Newbie
 */
export function getRatingTitle(rating: number): string {
  const band = RATING_BANDS.find((b) => rating >= b.threshold);
  return band ? band.label : 'Newbie';
}
