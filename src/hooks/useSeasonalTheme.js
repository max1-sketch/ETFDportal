import { useEffect, useState } from 'react';

const SEASONS = ['winter', 'spring', 'summer', 'fall'];

/**
 * Determines the current season from a date.
 * Winter: Dec-Feb, Spring: Mar-May, Summer: Jun-Aug, Fall: Sep-Nov
 */
export function getSeasonFromDate(date = new Date()) {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'fall';
}

/**
 * Applies a seasonal theme by setting data-season on <html>.
 * Pass a forcedSeason to override auto-detection (useful for testing).
 * Returns the active season string.
 */
export function useSeasonalTheme(forcedSeason) {
  const [season, setSeason] = useState(forcedSeason || getSeasonFromDate());

  useEffect(() => {
    const s = forcedSeason || getSeasonFromDate();
    setSeason(s);
    document.documentElement.setAttribute('data-season', s);
    return () => {
      document.documentElement.removeAttribute('data-season');
    };
  }, [forcedSeason]);

  return season;
}

export { SEASONS };