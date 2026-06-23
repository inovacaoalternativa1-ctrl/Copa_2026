import { ALL_PLAYERS } from '../data/luckyPlayers';

// Busca o resultado real de Brasil x Escócia na API-Football e tenta casar o
// artilheiro do primeiro gol com a nossa lista de convocados.
// Não toca em nada do autoExtras.js / syncScores.js — é um fluxo isolado,
// só pro Palpite da Sorte.

const API_KEY = process.env.REACT_APP_API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

const apiFetch = async (path) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'x-apisports-key': API_KEY },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}: ${path}`);
  return res.json();
};

const normalize = (str = '') =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, '').trim();

// ESPN é público (sem chave) e sem o limite de janela de datas do plano free da
// API-Football — usado como fonte principal pra achar data/hora do jogo, e como
// fallback pra apurar o resultado quando a API-Football não responder.
const ESPN_LEAGUES = ['fifa.worldcup', 'intl-friendlies', 'all'];

const findFixtureESPN = async (dateOffsetStart, dateOffsetEnd) => {
  const now = new Date();
  for (const league of ESPN_LEAGUES) {
    for (let offset = dateOffsetStart; offset <= dateOffsetEnd; offset++) {
      const ds = new Date(now.getTime() + offset * 86400000).toISOString().split('T')[0].replace(/-/g, '');
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${ds}`);
        if (!res.ok) continue;
        const data = await res.json();
        for (const ev of (data.events || [])) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;
          const homeC = comp.competitors?.find(c => c.homeAway === 'home');
          const awayC = comp.competitors?.find(c => c.homeAway === 'away');
          if (!homeC || !awayC) continue;
          const names = [homeC.team.displayName, awayC.team.displayName];
          if (!names.includes('Brazil') || !names.includes('Scotland')) continue;
          return {
            eventId: ev.id,
            kickoff: comp.date || ev.date,
            status: comp.status?.type?.completed ? 'FT' : (comp.status?.type?.state === 'in' ? 'LIVE' : 'NS'),
            homeIsBrasil: homeC.team.displayName === 'Brazil',
            scoreHome: parseInt(homeC.score || 0, 10),
            scoreAway: parseInt(awayC.score || 0, 10),
          };
        }
      } catch { /* tenta a próxima liga/data */ }
    }
  }
  return null;
};

// Acha o jogador da nossa lista cujo nome tem mais sobreposição de tokens
// com o nome retornado pela API (ex: API manda "Vinicius Junior", a gente tem "Vinícius Júnior").
const matchPlayer = (apiName, team) => {
  if (!apiName) return null;
  const apiTokens = new Set(normalize(apiName).split(/\s+/).filter(Boolean));
  let best = null;
  let bestScore = 0;
  for (const p of ALL_PLAYERS) {
    if (team && p.team !== team) continue;
    const pTokens = normalize(p.name).split(/\s+/).filter(Boolean);
    const overlap = pTokens.filter(t => apiTokens.has(t)).length;
    if (overlap > bestScore) { bestScore = overlap; best = p; }
  }
  return bestScore > 0 ? best : null;
};

const KICKOFF_CACHE_KEY = 'copa_lucky_kickoff_cache_v2'; // v2: agora usa ESPN também, invalida cache antigo
const KICKOFF_FOUND_TTL = 12 * 60 * 60 * 1000; // já achou a data do jogo — não muda, cacheia bastante
const KICKOFF_NOT_FOUND_TTL = 15 * 60 * 1000;  // ainda não achou — tenta de novo em 15 min

/**
 * Busca o horário oficial do jogo Brasil x Escócia (pra travar os palpites 1h antes).
 * Cacheia no localStorage pra não bater na API em toda visita à página.
 * Retorna o ISO string do kickoff, ou null se a API ainda não listou o jogo.
 */
export const getLuckyKickoff = async () => {
  try {
    const cached = JSON.parse(localStorage.getItem(KICKOFF_CACHE_KEY) || 'null');
    if (cached) {
      const ttl = cached.kickoff ? KICKOFF_FOUND_TTL : KICKOFF_NOT_FOUND_TTL;
      if (Date.now() - cached.ts < ttl) return cached.kickoff;
    }
  } catch { /* cache corrompido, ignora */ }

  let kickoff = null;

  // 1. ESPN — gratuito, sem chave, sem limite de janela de datas.
  try {
    const espnFixture = await findFixtureESPN(-3, 10);
    if (espnFixture) kickoff = espnFixture.kickoff;
  } catch { /* tenta API-Football abaixo */ }

  // 2. API-Football — fallback (plano free só cobre uma janela curta de datas).
  if (!kickoff && API_KEY) {
    try {
      const now = new Date();
      for (let offset = -2; offset <= 6; offset++) {
        const dt = new Date(now.getTime() + offset * 86400000);
        const date = dt.toISOString().split('T')[0];
        const data = await apiFetch(`/fixtures?date=${date}`);
        const fixture = (data.response || []).find(f => {
          const h = f.teams.home.name, a = f.teams.away.name;
          return (h === 'Brazil' && a === 'Scotland') || (h === 'Scotland' && a === 'Brazil');
        });
        if (fixture) { kickoff = fixture.fixture.date; break; }
      }
    } catch { /* deixa kickoff null — falha aberta, não trava o palpite sem certeza */ }
  }

  localStorage.setItem(KICKOFF_CACHE_KEY, JSON.stringify({ ts: Date.now(), kickoff }));
  return kickoff;
};

const findFixture = async (dateStr) => {
  const d = new Date(dateStr);
  const dates = [-1, 0, 1].map(offset => {
    const dt = new Date(d.getTime() + offset * 86400000);
    return dt.toISOString().split('T')[0];
  });
  for (const date of dates) {
    const data = await apiFetch(`/fixtures?date=${date}`);
    const fixture = (data.response || []).find(f => {
      const h = f.teams.home.name;
      const a = f.teams.away.name;
      return (h === 'Brazil' && a === 'Scotland') || (h === 'Scotland' && a === 'Brazil');
    });
    if (fixture) {
      return {
        fixtureId: fixture.fixture.id,
        status: fixture.fixture.status.short,
        homeIsBrasil: fixture.teams.home.name === 'Brazil',
        homeTeamId: fixture.teams.home.id,
        awayTeamId: fixture.teams.away.id,
        scoreHome: fixture.goals.home,
        scoreAway: fixture.goals.away,
      };
    }
  }
  return null;
};

/**
 * Busca o jogo Brasil x Escócia na API-Football e monta um preview do resultado.
 * Não grava nada — só retorna os dados pra o admin revisar antes de confirmar.
 */
export const detectLuckyResult = async (referenceDate = new Date().toISOString()) => {
  if (!API_KEY) throw new Error('REACT_APP_API_FOOTBALL_KEY não configurada');

  const info = await findFixture(referenceDate);
  if (!info) throw new Error('Jogo Brasil x Escócia não encontrado na API ainda.');

  const brasilTeamId = info.homeIsBrasil ? info.homeTeamId : info.awayTeamId;
  const escociaTeamId = info.homeIsBrasil ? info.awayTeamId : info.homeTeamId;
  const scoreA = info.homeIsBrasil ? info.scoreHome : info.scoreAway;
  const scoreB = info.homeIsBrasil ? info.scoreAway : info.scoreHome;

  const eventsData = await apiFetch(`/fixtures/events?fixture=${info.fixtureId}`);
  const events = eventsData.response || [];

  const goals = events.filter(e => e.type === 'Goal' && e.detail !== 'Missed Penalty');
  const firstGoal = goals[0];
  const firstTeam = firstGoal
    ? (firstGoal.team.id === brasilTeamId ? 'brasil' : firstGoal.team.id === escociaTeamId ? 'escocia' : null)
    : null;

  const scorerNameRaw = firstGoal?.player?.name || null;
  const scorerTeam = firstTeam;
  const scorerMatched = matchPlayer(scorerNameRaw, scorerTeam);

  const hasPenalty = events.some(e => e.type === 'Goal' && (e.detail === 'Penalty' || e.detail === 'Missed Penalty'));
  const isRed = (e) => e.type === 'Card' && (e.detail === 'Red Card' || e.detail === 'Yellow Red Card');
  const hasRedCard = events.some(isRed);
  const hasYellowBrasil = events.some(e => e.type === 'Card' && e.detail === 'Yellow Card' && e.team.id === brasilTeamId);
  const hasYellowEscocia = events.some(e => e.type === 'Card' && e.detail === 'Yellow Card' && e.team.id === escociaTeamId);
  const hasYellowCard = hasYellowBrasil || hasYellowEscocia;
  const yellowTeam = hasYellowBrasil && hasYellowEscocia ? 'ambos' : hasYellowBrasil ? 'brasil' : hasYellowEscocia ? 'escocia' : null;

  return {
    status: info.status,
    isFinished: info.status === 'FT' || info.status === 'AET' || info.status === 'PEN',
    scoreA, scoreB,
    firstTeam,
    scorerNameRaw,
    scorerMatched, // { name, team } da nossa lista, ou null se não achou
    penalty: hasPenalty,
    redCard: hasRedCard,
    yellowCard: hasYellowCard,
    yellowTeam,
  };
};
