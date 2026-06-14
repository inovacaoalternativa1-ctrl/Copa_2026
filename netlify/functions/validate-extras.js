const { createClient } = require('@supabase/supabase-js');

const AF_KEY   = process.env.REACT_APP_API_FOOTBALL_KEY;
const AF_BASE  = 'https://v3.football.api-sports.io';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup';

const DB_TO_API = {
  'Brasil':'Brazil','Argentina':'Argentina','França':'France','Alemanha':'Germany',
  'Espanha':'Spain','Portugal':'Portugal','Inglaterra':'England','Holanda':'Netherlands',
  'Bélgica':'Belgium','Itália':'Italy','Croácia':'Croatia','Suíça':'Switzerland',
  'Dinamarca':'Denmark','Suécia':'Sweden','Noruega':'Norway','Áustria':'Austria',
  'Escócia':'Scotland','Turquia':'Turkey','México':'Mexico','Estados Unidos':'United States',
  'Canadá':'Canada','Uruguai':'Uruguay','Colômbia':'Colombia','Equador':'Ecuador',
  'Paraguai':'Paraguay','Chile':'Chile','Peru':'Peru','Venezuela':'Venezuela',
  'Bolívia':'Bolivia','Marrocos':'Morocco','Senegal':'Senegal','Gana':'Ghana',
  'Egito':'Egypt','Nigéria':'Nigeria','Costa do Marfim':'Ivory Coast','Camarões':'Cameroon',
  'África do Sul':'South Africa','Tunísia':'Tunisia','Mali':'Mali','Argélia':'Algeria',
  'RD Congo':'DR Congo','Cabo Verde':'Cape Verde','Japão':'Japan','Coreia do Sul':'South Korea',
  'Austrália':'Australia','Irã':'Iran','Arábia Saudita':'Saudi Arabia','Catar':'Qatar',
  'Jordânia':'Jordan','Iraque':'Iraq','Uzbequistão':'Uzbekistan','Nova Zelândia':'New Zealand',
  'Bósnia':'Bosnia and Herzegovina','Tchéquia':'Czech Republic','Curaçao':'Curacao',
  'Haiti':'Haiti','Panamá':'Panama','Honduras':'Honduras','Jamaica':'Jamaica',
  'Guatemala':'Guatemala','El Salvador':'El Salvador',
};

const yn = cond => ({ answer: cond ? 'yes' : 'no' });

const buildResults = (events, status, homeIsTeamA, homeTeamId, awayTeamId, scoreA, scoreB) => {
  const teamAId = homeIsTeamA ? homeTeamId : awayTeamId;
  const teamBId = homeIsTeamA ? awayTeamId : homeTeamId;
  const goals = events.filter(e => e.type === 'Goal' && e.detail !== 'Missed Penalty');
  const h1Goals = goals.filter(e => e.time.elapsed <= 45 && !e.time.extra);
  const h2Goals = goals.filter(e => e.time.elapsed > 45 && e.time.elapsed <= 90 && !e.time.extra);
  const firstGoal = goals[0];
  const firstScorer = !firstGoal ? 'none'
    : firstGoal.team.id === teamAId ? 'A'
    : firstGoal.team.id === teamBId ? 'B' : 'none';
  const isRed = e => e.type === 'Card' && (e.detail === 'Red Card' || e.detail === 'Yellow Red Card');
  return {
    1:  yn(h1Goals.length > 0),
    2:  yn(h2Goals.length > 0),
    3:  { team: firstScorer },
    4:  yn(h1Goals.some(e => e.team.id === teamAId)),
    5:  yn(h1Goals.some(e => e.team.id === teamBId)),
    6:  yn(events.some(e => e.type === 'Card' && e.detail === 'Yellow Card' && e.team.id === teamAId)),
    7:  yn(events.some(e => e.type === 'Card' && e.detail === 'Yellow Card' && e.team.id === teamBId)),
    8:  yn(events.some(isRed)),
    9:  yn(events.some(e => isRed(e) && e.team.id === teamAId)),
    10: yn(events.some(e => isRed(e) && e.team.id === teamBId)),
    11: yn(events.some(e => e.type === 'Goal' && (e.detail === 'Penalty' || e.detail === 'Missed Penalty'))),
    12: yn(scoreA > 0 && scoreB > 0),
    13: yn(events.filter(e => e.type === 'Card' && e.detail === 'Yellow Card').length >= 4),
    14: yn(goals.some(e => e.detail === 'Own Goal')),
    15: yn(status === 'AET' || status === 'PEN'),
    16: yn(status === 'PEN'),
  };
};

// Tenta API-Football por data
const findViaAF = async (matchDate, nameA, nameB) => {
  if (!AF_KEY) return null;
  const API_TO_DB = Object.fromEntries(Object.entries(DB_TO_API).map(([db, en]) => [en, db]));
  const apiToDb = n => API_TO_DB[n] || n;
  const date = matchDate.split('T')[0];
  const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
  for (const d of [date, yesterday]) {
    try {
      const r = await fetch(`${AF_BASE}/fixtures?date=${d}`, { headers: { 'x-apisports-key': AF_KEY } });
      if (!r.ok) continue;
      const data = await r.json();
      const f = (data.response || []).find(f => {
        const h = apiToDb(f.teams.home.name);
        const a = apiToDb(f.teams.away.name);
        const dbA = Object.keys(DB_TO_API).find(k => DB_TO_API[k] === nameA) || nameA;
        const dbB = Object.keys(DB_TO_API).find(k => DB_TO_API[k] === nameB) || nameB;
        return (h === dbA && a === dbB) || (h === dbB && a === dbA);
      });
      if (f) return { source: 'af', fixtureId: f.fixture.id, homeIsTeamA: f.teams.home.name === nameA, homeTeamId: f.teams.home.id, awayTeamId: f.teams.away.id };
    } catch(e) { console.warn('[validate-extras] AF erro:', e.message); }
  }
  return null;
};

// Tenta ESPN scoreboard
const findViaESPN = async (matchDate, nameA, nameB) => {
  const date = matchDate.split('T')[0];
  const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
  for (const d of [date, yesterday]) {
    try {
      const ds = d.replace(/-/g, '');
      const r = await fetch(`${ESPN_BASE}/scoreboard?dates=${ds}`);
      if (!r.ok) continue;
      const data = await r.json();
      console.log(`[validate-extras] ESPN scoreboard ${ds}: ${(data.events||[]).length} eventos`);
      for (const ev of (data.events || [])) {
        const comp = ev.competitions?.[0];
        if (!comp) continue;
        const homeC = comp.competitors?.find(c => c.homeAway === 'home');
        const awayC = comp.competitors?.find(c => c.homeAway === 'away');
        if (!homeC || !awayC) continue;
        const h = homeC.team.displayName;
        const a = awayC.team.displayName;
        console.log(`[validate-extras] ESPN evento: ${h} vs ${a}`);
        if ((h === nameA && a === nameB) || (h === nameB && a === nameA)) {
          return { source: 'espn', eventId: ev.id, homeIsTeamA: h === nameA, homeTeamId: homeC.team.id, awayTeamId: awayC.team.id };
        }
      }
    } catch(e) { console.warn('[validate-extras] ESPN scoreboard erro:', e.message); }
  }
  return null;
};

// Busca eventos via ESPN summary
const fetchESPNEvents = async (eventId) => {
  const r = await fetch(`${ESPN_BASE}/summary?event=${eventId}`);
  if (!r.ok) return { events: [], raw: null };
  const data = await r.json();
  console.log('[validate-extras] ESPN summary keys:', Object.keys(data));

  const events = [];
  // Tenta plays
  for (const play of (data.plays || [])) {
    const typeText = (play.type?.text || play.type?.name || '').toLowerCase();
    const teamId = play.team?.id || null;
    const elapsed = play.clock?.value ? Math.ceil(play.clock.value / 60) : 45;
    if (play.scoringPlay || typeText.includes('goal')) {
      events.push({ type:'Goal', detail: typeText.includes('own') ? 'Own Goal' : typeText.includes('pen') ? 'Penalty' : 'Normal Goal', team:{id:teamId}, time:{elapsed, extra:null} });
    } else if (typeText.includes('yellow-red') || typeText.includes('second yellow')) {
      events.push({ type:'Card', detail:'Yellow Red Card', team:{id:teamId}, time:{elapsed, extra:null} });
    } else if (typeText.includes('red')) {
      events.push({ type:'Card', detail:'Red Card', team:{id:teamId}, time:{elapsed, extra:null} });
    } else if (typeText.includes('yellow') || typeText.includes('caution') || typeText.includes('booking')) {
      events.push({ type:'Card', detail:'Yellow Card', team:{id:teamId}, time:{elapsed, extra:null} });
    }
  }
  // Tenta keyPlays se plays vazio
  for (const play of (events.length ? [] : (data.keyPlays || []))) {
    const typeText = (play.type?.text || '').toLowerCase();
    const teamId = play.team?.id || null;
    const elapsed = parseInt(play.clock?.displayValue || '45');
    if (typeText.includes('goal') || play.scoringPlay) {
      events.push({ type:'Goal', detail: typeText.includes('own') ? 'Own Goal' : 'Normal Goal', team:{id:teamId}, time:{elapsed, extra:null} });
    }
  }

  console.log(`[validate-extras] ESPN events parseados: ${events.length}`);
  return { events, rawKeys: Object.keys(data) };
};

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  const matchId = parseInt(event.queryStringParameters?.match_id);
  if (!matchId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'match_id obrigatório' }) };

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (!match) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Jogo não encontrado' }) };

  const nameA = DB_TO_API[match.team_a] || match.team_a;
  const nameB = DB_TO_API[match.team_b] || match.team_b;
  const scoreA = match.score_a ?? 0;
  const scoreB = match.score_b ?? 0;

  console.log(`[validate-extras] Jogo ${matchId}: ${match.team_a} (${nameA}) vs ${match.team_b} (${nameB}), ${scoreA}×${scoreB}`);

  // 1. Tenta API-Football
  let info = await findViaAF(match.match_date, nameA, nameB);
  // 2. Fallback ESPN
  if (!info) info = await findViaESPN(match.match_date, nameA, nameB);

  if (!info) {
    console.warn('[validate-extras] Jogo não encontrado em nenhuma API');
    return { statusCode: 200, headers, body: JSON.stringify({ validated: 0, error: 'Jogo não encontrado nas APIs' }) };
  }

  console.log(`[validate-extras] Encontrado via ${info.source}, homeIsTeamA=${info.homeIsTeamA}`);

  let events = [];
  let rawInfo = {};

  if (info.source === 'af') {
    const r = await fetch(`${AF_BASE}/fixtures/events?fixture=${info.fixtureId}`, { headers: { 'x-apisports-key': AF_KEY } });
    if (r.ok) {
      const d = await r.json();
      events = d.response || [];
      console.log(`[validate-extras] AF eventos: ${events.length}`);
    }
  } else {
    const result = await fetchESPNEvents(info.eventId);
    events = result.events;
    rawInfo = result;
  }

  const results = buildResults(events, 'FT', info.homeIsTeamA, info.homeTeamId, info.awayTeamId, scoreA, scoreB);
  console.log('[validate-extras] Resultados calculados:', JSON.stringify(results));

  const validated = [];
  for (const [typeIdStr, result] of Object.entries(results)) {
    const typeId = parseInt(typeIdStr);
    const { error } = await supabase.from('extra_results').upsert(
      { match_id: matchId, extra_type_id: typeId, official_result: result, is_validated: true, validated_at: new Date().toISOString(), validated_by: null },
      { onConflict: 'match_id,extra_type_id' }
    );
    if (error) console.error(`[validate-extras] Upsert tipo ${typeId} falhou:`, error.message);
    else validated.push(typeId);
  }

  console.log(`[validate-extras] ${validated.length}/16 extras inseridos`);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ validated: validated.length, source: info.source, events: events.length, rawInfo }),
  };
};
