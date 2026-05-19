const API_KEY = process.env.REACT_APP_FOOTBALL_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

export const getLiveMatches = async () => {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches?status=LIVE`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) throw new Error(`Football API ${res.status}`);
  const data = await res.json();
  return data.matches || [];
};
