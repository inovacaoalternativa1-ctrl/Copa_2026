const API_KEY = process.env.REACT_APP_FOOTBALL_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

const ACTIVE_STATUSES = new Set(['LIVE', 'IN_PLAY', 'PAUSED']);

const isoDate = (date) => date.toISOString().split('T')[0];

export const getWorldCupMatchesAroundToday = async () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const res = await fetch(
    `${BASE_URL}/competitions/WC/matches?dateFrom=${isoDate(yesterday)}&dateTo=${isoDate(tomorrow)}`,
    {
      headers: { 'X-Auth-Token': API_KEY },
    }
  );

  if (!res.ok) throw new Error(`Football API ${res.status}`);
  const data = await res.json();
  return data.matches || [];
};

export const getLiveMatches = async () => {
  const matches = await getWorldCupMatchesAroundToday();
  return matches.filter(match => ACTIVE_STATUSES.has(match.status));
};

export const getRecentlyFinishedMatches = async () => {
  const matches = await getWorldCupMatchesAroundToday();
  return matches.filter(match => match.status === 'FINISHED');
};

export const getLiveAndFinishedMatches = async () => {
  const matches = await getWorldCupMatchesAroundToday();
  return matches.filter(match => ACTIVE_STATUSES.has(match.status) || match.status === 'FINISHED');
};

export const getLiveMatchesByStatusEndpoint = async () => {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches?status=LIVE`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) throw new Error(`Football API ${res.status}`);
  const data = await res.json();
  return data.matches || [];
};
