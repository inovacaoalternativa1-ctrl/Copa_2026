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

// Find the API-Football fixture for a given Supabase match
const findFixture = async (matchDate, teamA, teamB) => {
  const date = matchDate.split('T')[0];
  const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
  // Plano free não suporta filtro de liga em histórico — busca por data sem league/season
  let data = await apiFetch(`/fixtures?date=${date}`);
  let fixtures = data.response || [];
  if (!fixtures.length) {
    data = await apiFetch(`/fixtures?date=${yesterday}`);
    fixtures = data.response || [];
  }
  const nameA = DB_TO_API[teamA] || teamA;
  const nameB = DB_TO_API[teamB] || teamB;

  // Converte nome da API → nome no banco (tenta DB_TO_API reverso e aliases)
  const API_TO_DB_LOCAL = Object.fromEntries(Object.entries(DB_TO_API).map(([db, en]) => [en, db]));
  const apiToDb = name => API_TO_DB_LOCAL[name] || API_ALIASES[name] || name;

  const fixture = fixtures.find(f => {
    const hDb = apiToDb(f.teams.home.name);
    const aDb = apiToDb(f.teams.away.name);
    return (hDb === teamA && aDb === teamB) || (hDb === teamB && aDb === teamA);
  });

  if (!fixture) return null;

  return {
    fixtureId:  fixture.fixture.id,
    status:     fixture.fixture.status.short,  // FT, AET, PEN
    homeIsTeamA: fixture.teams.home.name === nameA,
    homeTeamId:  fixture.teams.home.id,
    awayTeamId:  fixture.teams.away.id,
  };
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
  if (!API_KEY) {
    console.warn('[autoExtras] REACT_APP_API_FOOTBALL_KEY não configurada — pulando validação automática de extras');
    return { validated: [], skipped: [] };
  }

  try {
    const info = await findFixture(match.match_date, match.team_a, match.team_b);
    if (!info) {
      console.warn(`[autoExtras] Jogo não encontrado na API: ${match.team_a} vs ${match.team_b}`);
      return { validated: [], skipped: [] };
    }

    const { fixtureId, status, homeIsTeamA, homeTeamId, awayTeamId } = info;

    const eventsData = await apiFetch(`/fixtures/events?fixture=${fixtureId}`);
    const events = eventsData.response || [];

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
