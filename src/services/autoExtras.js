const API_KEY  = process.env.REACT_APP_API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

// Aliases que a API-Football usa com nomes diferentes
const API_ALIASES = {
  'Czechia':'Tchéquia', 'Czech Rep.':'Tchéquia', 'Czech Republic':'Tchéquia',
  'Korea Republic':'Coreia do Sul', 'Korea, South':'Coreia do Sul', 'South Korea':'Coreia do Sul',
  'USA':'Estados Unidos', 'United States':'Estados Unidos',
  'IR Iran':'Irã', 'Iran':'Irã',
  'Ivory Coast':'Costa do Marfim', "Côte d'Ivoire":'Costa do Marfim', "Cote d'Ivoire":'Costa do Marfim',
  'DR Congo':'RD Congo', 'Congo DR':'RD Congo',
  'Bosnia and Herzegovina':'Bósnia', 'Bosnia':'Bósnia',
  'Netherlands':'Holanda', 'Holland':'Holanda',
  'Saudi Arabia':'Arábia Saudita',
  'New Zealand':'Nova Zelândia',
  'Cape Verde':'Cabo Verde',
};

// Portuguese DB name → API-Football English name
const DB_TO_API = {
  'Brasil':'Brazil', 'Argentina':'Argentina', 'França':'France',
  'Alemanha':'Germany', 'Espanha':'Spain', 'Portugal':'Portugal',
  'Inglaterra':'England', 'Holanda':'Netherlands', 'Bélgica':'Belgium',
  'Itália':'Italy', 'Croácia':'Croatia', 'Suíça':'Switzerland',
  'Dinamarca':'Denmark', 'Suécia':'Sweden', 'Noruega':'Norway',
  'Áustria':'Austria', 'Escócia':'Scotland', 'Turquia':'Turkey',
  'México':'Mexico', 'Estados Unidos':'United States', 'Canadá':'Canada',
  'Uruguai':'Uruguay', 'Colômbia':'Colombia', 'Equador':'Ecuador',
  'Paraguai':'Paraguay', 'Chile':'Chile', 'Peru':'Peru',
  'Venezuela':'Venezuela', 'Bolívia':'Bolivia',
  'Marrocos':'Morocco', 'Senegal':'Senegal', 'Gana':'Ghana',
  'Egito':'Egypt', 'Nigéria':'Nigeria', 'Costa do Marfim':"Ivory Coast",
  'Camarões':'Cameroon', 'África do Sul':'South Africa',
  'Tunísia':'Tunisia', 'Mali':'Mali', 'Argélia':'Algeria',
  'RD Congo':'DR Congo', 'Cabo Verde':'Cape Verde',
  'Japão':'Japan', 'Coreia do Sul':'South Korea', 'Austrália':'Australia',
  'Irã':'Iran', 'Arábia Saudita':'Saudi Arabia', 'Catar':'Qatar',
  'Jordânia':'Jordan', 'Iraque':'Iraq', 'Uzbequistão':'Uzbekistan',
  'Nova Zelândia':'New Zealand', 'Bósnia':'Bosnia and Herzegovina',
  'Tchéquia':'Czech Republic', 'Curaçao':'Curacao', 'Haiti':'Haiti',
  'Panamá':'Panama', 'Honduras':'Honduras', 'Jamaica':'Jamaica',
  'Guatemala':'Guatemala', 'El Salvador':'El Salvador',
};

const yn = (cond) => ({ answer: cond ? 'yes' : 'no' });

const apiFetch = async (path) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'x-apisports-key': API_KEY },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}: ${path}`);
  return res.json();
};

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup';

// Busca fixture via API-Football (plano free: data atual funciona)
const findFixtureAF = async (matchDate, teamA, teamB) => {
  const date = matchDate.split('T')[0];
  const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
  const nameA = DB_TO_API[teamA] || teamA;
  const nameB = DB_TO_API[teamB] || teamB;
  const API_TO_DB_LOCAL = Object.fromEntries(Object.entries(DB_TO_API).map(([db, en]) => [en, db]));
  const apiToDb = name => API_TO_DB_LOCAL[name] || API_ALIASES[name] || name;

  for (const d of [date, yesterday]) {
    const data = await apiFetch(`/fixtures?date=${d}`);
    const fixture = (data.response || []).find(f => {
      const hDb = apiToDb(f.teams.home.name);
      const aDb = apiToDb(f.teams.away.name);
      return (hDb === teamA && aDb === teamB) || (hDb === teamB && aDb === teamA);
    });
    if (fixture) {
      return {
        source: 'af',
        fixtureId:   fixture.fixture.id,
        status:      fixture.fixture.status.short,
        homeIsTeamA: fixture.teams.home.name === nameA,
        homeTeamId:  fixture.teams.home.id,
        awayTeamId:  fixture.teams.away.id,
      };
    }
  }
  return null;
};

// Busca fixture via ESPN (público, sem chave, retorna jogos do dia)
const findFixtureESPN = async (matchDate, teamA, teamB) => {
  const nameA = DB_TO_API[teamA] || teamA;
  const nameB = DB_TO_API[teamB] || teamB;
  const date = matchDate.split('T')[0];
  const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];

  for (const d of [date, yesterday]) {
    const ds = d.replace(/-/g, '');
    const r = await fetch(`${ESPN_BASE}/scoreboard?dates=${ds}`);
    if (!r.ok) continue;
    const data = await r.json();
    for (const ev of (data.events || [])) {
      const comp = ev.competitions?.[0];
      if (!comp) continue;
      const homeC = comp.competitors?.find(c => c.homeAway === 'home');
      const awayC = comp.competitors?.find(c => c.homeAway === 'away');
      if (!homeC || !awayC) continue;
      const h = homeC.team.displayName;
      const a = awayC.team.displayName;
      if ((h === nameA && a === nameB) || (h === nameB && a === nameA)) {
        return {
          source: 'espn',
          eventId:     ev.id,
          status:      comp.status?.type?.name || 'FT',
          homeIsTeamA: h === nameA,
          homeTeamId:  homeC.team.id,
          awayTeamId:  awayC.team.id,
        };
      }
    }
  }
  return null;
};

// Converte plays da ESPN para o formato esperado por buildResults
const fetchESPNEvents = async (eventId, homeTeamId, awayTeamId) => {
  const r = await fetch(`${ESPN_BASE}/summary?event=${eventId}`);
  if (!r.ok) return [];
  const data = await r.json();
  const plays = data.plays || [];
  const events = [];
  for (const play of plays) {
    const typeText = (play.type?.text || play.type?.name || '').toLowerCase();
    const teamId = play.team?.id || null;
    const elapsed = play.clock?.value ? Math.ceil(play.clock.value / 60) : (play.period?.number === 1 ? 45 : 90);

    if (play.scoringPlay || typeText.includes('goal')) {
      events.push({
        type: 'Goal',
        detail: typeText.includes('own') ? 'Own Goal' : typeText.includes('penalty') ? 'Penalty' : 'Normal Goal',
        team: { id: teamId },
        time: { elapsed, extra: null },
      });
    } else if (typeText.includes('yellow-red') || typeText.includes('second yellow') || typeText.includes('yellowred')) {
      events.push({ type: 'Card', detail: 'Yellow Red Card', team: { id: teamId }, time: { elapsed, extra: null } });
    } else if (typeText.includes('red card') || typeText === 'red') {
      events.push({ type: 'Card', detail: 'Red Card', team: { id: teamId }, time: { elapsed, extra: null } });
    } else if (typeText.includes('yellow') || typeText.includes('caution') || typeText === 'booking') {
      events.push({ type: 'Card', detail: 'Yellow Card', team: { id: teamId }, time: { elapsed, extra: null } });
    }
  }
  return events;
};

// Find the fixture — tenta API-Football primeiro, depois ESPN
const findFixture = async (matchDate, teamA, teamB) => {
  if (API_KEY) {
    try {
      const af = await findFixtureAF(matchDate, teamA, teamB);
      if (af) return af;
    } catch(e) {
      console.warn('[autoExtras] API-Football falhou:', e.message);
    }
  }
  console.warn('[autoExtras] Tentando ESPN para', teamA, 'vs', teamB);
  return findFixtureESPN(matchDate, teamA, teamB);
};

// Build official results for all 16 extra types
const buildResults = (events, status, homeIsTeamA, homeTeamId, awayTeamId, scoreA, scoreB) => {
  const teamAId = homeIsTeamA ? homeTeamId : awayTeamId;
  const teamBId = homeIsTeamA ? awayTeamId : homeTeamId;

  const goals = events.filter(e => e.type === 'Goal' && e.detail !== 'Missed Penalty');

  const h1Goals = goals.filter(e => e.time.elapsed <= 45 && !e.time.extra);
  const h2Goals = goals.filter(e => e.time.elapsed > 45 && e.time.elapsed <= 90 && !e.time.extra);

  const firstGoal = goals[0];
  let firstScorer = 'none';
  if (firstGoal) {
    firstScorer = firstGoal.team.id === teamAId ? 'A'
                : firstGoal.team.id === teamBId ? 'B'
                : 'none';
  }

  const hasYellowA    = events.some(e => e.type === 'Card' && e.detail === 'Yellow Card' && e.team.id === teamAId);
  const hasYellowB    = events.some(e => e.type === 'Card' && e.detail === 'Yellow Card' && e.team.id === teamBId);
  const totalYellows  = events.filter(e => e.type === 'Card' && e.detail === 'Yellow Card').length;
  const isRed         = (e) => e.type === 'Card' && (e.detail === 'Red Card' || e.detail === 'Yellow Red Card');
  const hasRedAny     = events.some(isRed);
  const hasRedA       = events.some(e => isRed(e) && e.team.id === teamAId);
  const hasRedB       = events.some(e => isRed(e) && e.team.id === teamBId);
  const hasPenalty    = events.some(e => e.type === 'Goal' && (e.detail === 'Penalty' || e.detail === 'Missed Penalty'));
  const hasOwnGoal    = goals.some(e => e.detail === 'Own Goal');
  const hasAET        = status === 'AET' || status === 'PEN';
  const hasPEN        = status === 'PEN';
  const bothScore     = scoreA > 0 && scoreB > 0;

  return {
    1:  yn(h1Goals.length > 0),                              // Gol no Primeiro Tempo
    2:  yn(h2Goals.length > 0),                              // Gol no Segundo Tempo
    3:  { team: firstScorer },                               // Primeiro Time a Marcar
    4:  yn(h1Goals.some(e => e.team.id === teamAId)),        // Time A Marca no 1° Tempo
    5:  yn(h1Goals.some(e => e.team.id === teamBId)),        // Time B Marca no 1° Tempo
    6:  yn(hasYellowA),                                      // Cartão Amarelo - Time A
    7:  yn(hasYellowB),                                      // Cartão Amarelo - Time B
    8:  yn(hasRedAny),                                       // Cartão Vermelho no Jogo
    9:  yn(hasRedA),                                         // Cartão Vermelho - Time A
    10: yn(hasRedB),                                         // Cartão Vermelho - Time B
    11: yn(hasPenalty),                                      // Pênalti no Jogo
    12: yn(bothScore),                                       // Ambos os Times Marcam
    13: yn(totalYellows >= 4),                               // Mais de 3 Cartões Amarelos
    14: yn(hasOwnGoal),                                      // Gol Contra
    15: yn(hasAET),                                          // Prorrogação
    16: yn(hasPEN),                                          // Disputa de Pênaltis
  };
};

/**
 * Automatically validates all detectable extras for a finished match.
 * Call this right after adminSetMatchResult succeeds.
 *
 * @param {object} supabase  - Supabase client
 * @param {object} supabase  - Supabase client
 * @param {object} match     - Supabase match row (needs id, team_a, team_b, match_date)
 * @param {number} scoreA    - Final score team A
 * @param {number} scoreB    - Final score team B
 * @param {string} adminId   - Admin user ID
 * @returns {{ validated: number[], skipped: number[] }}
 */
export const autoValidateMatchExtras = async (supabase, match, scoreA, scoreB, adminId) => {
  try {
    const info = await findFixture(match.match_date, match.team_a, match.team_b);
    if (!info) {
      console.warn(`[autoExtras] Jogo não encontrado em nenhuma API: ${match.team_a} vs ${match.team_b}`);
      return { validated: [], skipped: [] };
    }

    const { source, homeIsTeamA, homeTeamId, awayTeamId } = info;

    let events;
    if (source === 'espn') {
      console.log(`[autoExtras] Usando ESPN para eventos do jogo ${match.id}`);
      events = await fetchESPNEvents(info.eventId, homeTeamId, awayTeamId);
    } else {
      if (!API_KEY) {
        console.warn('[autoExtras] REACT_APP_API_FOOTBALL_KEY não configurada');
        return { validated: [], skipped: [] };
      }
      const eventsData = await apiFetch(`/fixtures/events?fixture=${info.fixtureId}`);
      events = eventsData.response || [];
    }

    const status = info.status || 'FT';

    const results = buildResults(events, status, homeIsTeamA, homeTeamId, awayTeamId, scoreA, scoreB);

    const validated = [];
    const skipped   = [];

    for (const [typeIdStr, result] of Object.entries(results)) {
      const typeId = parseInt(typeIdStr);
      const { error } = await supabase.from('extra_results').upsert(
        {
          match_id:        match.id,
          extra_type_id:   typeId,
          official_result: result,
          is_validated:    true,
          validated_at:    new Date().toISOString(),
          validated_by:    adminId,
        },
        { onConflict: 'match_id,extra_type_id' }
      );
      if (error) {
        console.error(`[autoExtras] Erro ao validar extra ${typeId}:`, error.message);
      } else {
        validated.push(typeId);
      }
    }

    console.log(`[autoExtras] ${validated.length} extras validados automaticamente para jogo ${match.id}`);
    return { validated, skipped };
  } catch (e) {
    console.error('[autoExtras] Erro:', e.message);
    return { validated: [], skipped: [] };
  }
};
