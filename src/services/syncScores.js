import { getLiveAndFinishedMatches } from './footballApi';

// Maps every football-data.org English name → Supabase Portuguese name.
// Built by cross-referencing the API's SCHEDULED response with the DB team names.
const API_TO_DB = {
  'Mexico':               'México',
  'South Africa':         'África do Sul',
  'South Korea':          'Coreia do Sul',
  'Korea Republic':       'Coreia do Sul',
  'Czechia':              'Tchéquia',
  'Canada':               'Canadá',
  'Bosnia-Herzegovina':   'Bósnia',
  'United States':        'Estados Unidos',
  'Paraguay':             'Paraguai',
  'Qatar':                'Catar',
  'Switzerland':          'Suíça',
  'Brazil':               'Brasil',
  'Morocco':              'Marrocos',
  'Haiti':                'Haiti',
  'Scotland':             'Escócia',
  'Australia':            'Austrália',
  'Turkey':               'Turquia',
  'Germany':              'Alemanha',
  'Curaçao':              'Curaçao',
  'Netherlands':          'Holanda',
  'Japan':                'Japão',
  'Ivory Coast':          'Costa do Marfim',
  'Ecuador':              'Equador',
  'Sweden':               'Suécia',
  'Tunisia':              'Tunísia',
  'Spain':                'Espanha',
  'Cape Verde Islands':   'Cabo Verde',
  'Belgium':              'Bélgica',
  'Egypt':                'Egito',
  'Saudi Arabia':         'Arábia Saudita',
  'Iran':                 'Irã',
  'Uruguay':              'Uruguai',
  'New Zealand':          'Nova Zelândia',
  'France':               'França',
  'Senegal':              'Senegal',
  'Iraq':                 'Iraque',
  'Norway':               'Noruega',
  'Argentina':            'Argentina',
  'Algeria':              'Argélia',
  'Austria':              'Áustria',
  'Portugal':             'Portugal',
  'Congo DR':             'RD Congo',
  'England':              'Inglaterra',
  'Croatia':              'Croácia',
  'Ghana':                'Gana',
  'Uzbekistan':           'Uzbequistão',
  'Colombia':             'Colômbia',
  'Panama':               'Panamá',
  'Jordan':               'Jordânia',
};

const toDb = name => API_TO_DB[name] || name;

const LIVE_STATUSES = new Set(['LIVE', 'IN_PLAY', 'PAUSED']);

const normalizeLiveStatus = status => {
  if (status === 'PAUSED') return 'HALFTIME';
  if (LIVE_STATUSES.has(status)) return 'LIVE';
  if (status === 'FINISHED') return 'FINISHED';
  return status || 'UNKNOWN';
};

const estimateMinute = (utcDate, status) => {
  if (!utcDate || status === 'FINISHED') return null;
  if (status === 'PAUSED') return 'INTERVALO';

  const elapsed = Math.max(1, Math.floor((Date.now() - new Date(utcDate).getTime()) / 60000));
  if (elapsed <= 45) return `${elapsed}'`;
  if (elapsed <= 60) return 'INTERVALO';

  const secondHalfMinute = elapsed - 15;
  if (secondHalfMinute <= 90) return `${secondHalfMinute}'`;
  return `90+${secondHalfMinute - 90}'`;
};

const findDbMatch = (dbMatches, homeTeam, awayTeam) => {
  const dbHome = toDb(homeTeam);
  const dbAway = toDb(awayTeam);
  const found = dbMatches.find(m => m.team_a === dbHome && m.team_b === dbAway);
  if (!found) console.warn(`[syncScores] Sem correspondência: "${homeTeam}" (→"${dbHome}") vs "${awayTeam}" (→"${dbAway}")`);
  return found;
};

export const syncLiveScoreDetails = async (supabase) => {
  const apiMatches = await getLiveAndFinishedMatches();
  if (!apiMatches.length) return [];

  const { data: dbMatches } = await supabase.from('matches').select('id, team_a, team_b');
  if (!dbMatches?.length) return [];

  const details = [];

  for (const apiMatch of apiMatches) {
    const homeTeam = apiMatch.homeTeam?.name || '';
    const awayTeam = apiMatch.awayTeam?.name || '';
    const scoreA   = apiMatch.score?.fullTime?.home ?? apiMatch.score?.regularTime?.home ?? apiMatch.score?.halfTime?.home ?? null;
    const scoreB   = apiMatch.score?.fullTime?.away ?? apiMatch.score?.regularTime?.away ?? apiMatch.score?.halfTime?.away ?? null;
    const isFinished = apiMatch.status === 'FINISHED';
    const isLive = LIVE_STATUSES.has(apiMatch.status);

    const dbMatch = findDbMatch(dbMatches, homeTeam, awayTeam);
    if (!dbMatch) continue;

    if (isLive) {
      details.push({
        id: dbMatch.id,
        status: normalizeLiveStatus(apiMatch.status),
        minute: estimateMinute(apiMatch.utcDate, apiMatch.status),
        scoreA,
        scoreB,
      });
    }

    if (scoreA !== null && scoreB !== null) {
      const { error } = await supabase.rpc('update_match_score', {
        p_match_id: dbMatch.id,
        p_score_a:  scoreA,
        p_score_b:  scoreB,
        p_finished: isFinished,
      });
      if (error) console.error('[syncScores] RPC erro:', error.message);
      else console.log(`[syncScores] Placar atualizado: ${homeTeam} ${scoreA}x${scoreB} ${awayTeam}`);
    }
  }

  return details;
};

// Syncs live scores from football-data.org into the Supabase matches table.
// Returns a Set of Supabase match IDs currently LIVE.
export const syncLiveScores = async (supabase) => {
  const details = await syncLiveScoreDetails(supabase);
  return new Set(details.map(match => match.id));
};
