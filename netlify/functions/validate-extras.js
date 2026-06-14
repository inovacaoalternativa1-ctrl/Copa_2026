const { createClient } = require('@supabase/supabase-js');

const AF_KEY    = process.env.REACT_APP_API_FOOTBALL_KEY;
const AF_BASE   = 'https://v3.football.api-sports.io';
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

// English AF name → Portuguese DB name
const API_TO_DB = Object.fromEntries(Object.entries(DB_TO_API).map(([db,en]) => [en, db]));
const apiToDb = n => API_TO_DB[n] || n;

// ESPN 3-letter abbreviation → English name
const ESPN_ABBR = {
  'SCO':'Scotland','ENG':'England','WAL':'Wales','HAI':'Haiti',
  'USA':'United States','MEX':'Mexico','CAN':'Canada',
  'BRA':'Brazil','ARG':'Argentina','GER':'Germany','FRA':'France',
  'ESP':'Spain','POR':'Portugal','NED':'Netherlands','BEL':'Belgium',
  'ITA':'Italy','CRO':'Croatia','SUI':'Switzerland','AUT':'Austria',
  'DEN':'Denmark','SWE':'Sweden','NOR':'Norway','TUR':'Turkey',
  'MAR':'Morocco','SEN':'Senegal','GHA':'Ghana','EGY':'Egypt',
  'NGA':'Nigeria','CMR':'Cameroon','RSA':'South Africa','TUN':'Tunisia',
  'ALG':'Algeria','CIV':'Ivory Coast','DRC':'DR Congo','CPV':'Cape Verde',
  'JPN':'Japan','KOR':'South Korea','AUS':'Australia','IRN':'Iran',
  'KSA':'Saudi Arabia','QAT':'Qatar','JOR':'Jordan','IRQ':'Iraq',
  'UZB':'Uzbekistan','NZL':'New Zealand','BIH':'Bosnia and Herzegovina',
  'CZE':'Czech Republic','CUW':'Curacao','PAN':'Panama','HON':'Honduras',
  'JAM':'Jamaica','GUA':'Guatemala','SLV':'El Salvador',
  'URU':'Uruguay','COL':'Colombia','ECU':'Ecuador','PAR':'Paraguay',
  'CHI':'Chile','PER':'Peru','VEN':'Venezuela','BOL':'Bolivia',
};

const yn = cond => ({ answer: cond ? 'yes' : 'no' });

const buildResults = (events, status, homeIsTeamA, homeTeamId, awayTeamId, scoreA, scoreB) => {
  const teamAId = homeIsTeamA ? homeTeamId : awayTeamId;
  const teamBId = homeIsTeamA ? awayTeamId : homeTeamId;
  const goals   = events.filter(e => e.type === 'Goal' && e.detail !== 'Missed Penalty');
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
    6:  yn(events.some(e => e.type==='Card' && e.detail==='Yellow Card' && e.team.id===teamAId)),
    7:  yn(events.some(e => e.type==='Card' && e.detail==='Yellow Card' && e.team.id===teamBId)),
    8:  yn(events.some(isRed)),
    9:  yn(events.some(e => isRed(e) && e.team.id===teamAId)),
    10: yn(events.some(e => isRed(e) && e.team.id===teamBId)),
    11: yn(events.some(e => e.type==='Goal' && (e.detail==='Penalty' || e.detail==='Missed Penalty'))),
    12: yn(scoreA > 0 && scoreB > 0),
    13: yn(events.filter(e => e.type==='Card' && e.detail==='Yellow Card').length >= 4),
    14: yn(goals.some(e => e.detail==='Own Goal')),
    15: yn(status === 'AET' || status === 'PEN'),
    16: yn(status === 'PEN'),
  };
};

// ── API-Football ──────────────────────────────────────────────────────────────
// teamA e teamB chegam em inglês (DB_TO_API[match.team_x])
// ptA e ptB são os nomes em português (match.team_a / match.team_b)
const findViaAF = async (matchDate, nameA, nameB, ptA, ptB, savedFixtureId = null) => {
  if (!AF_KEY) return null;

  // 1. Fixture ID salvo no banco (mais rápido e confiável)
  if (savedFixtureId) {
    try {
      const r = await fetch(`${AF_BASE}/fixtures?id=${savedFixtureId}`, { headers:{ 'x-apisports-key': AF_KEY } });
      if (r.ok) {
        const data = await r.json();
        const f = data.response?.[0];
        if (f) {
          console.log(`[validate-extras] AF fixture direto: ${f.teams.home.name} vs ${f.teams.away.name}`);
          // AF retorna nomes em inglês — compara em inglês
          const h = f.teams.home.name;
          return { source:'af', fixtureId: savedFixtureId, homeIsTeamA: h===nameA || apiToDb(h)===ptA, homeTeamId: f.teams.home.id, awayTeamId: f.teams.away.id };
        }
      }
    } catch(e) { console.warn('[validate-extras] AF fixture direto erro:', e.message); }
  }

  // 2. Busca por data (inglês vs inglês, e também via apiToDb vs português)
  const date = matchDate.split('T')[0];
  const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
  for (const d of [date, yesterday]) {
    try {
      const r = await fetch(`${AF_BASE}/fixtures?date=${d}`, { headers:{ 'x-apisports-key': AF_KEY } });
      if (!r.ok) continue;
      const data = await r.json();
      const f = (data.response || []).find(f => {
        const rawH = f.teams.home.name, rawA = f.teams.away.name;
        const dbH  = apiToDb(rawH),    dbA  = apiToDb(rawA);
        // Tenta inglês direto OU via português
        return (rawH===nameA && rawA===nameB) || (rawH===nameB && rawA===nameA) ||
               (dbH===ptA   && dbA===ptB)    || (dbH===ptB    && dbA===ptA);
      });
      if (f) {
        const isHomeA = f.teams.home.name===nameA || apiToDb(f.teams.home.name)===ptA;
        return { source:'af', fixtureId: f.fixture.id, homeIsTeamA: isHomeA, homeTeamId: f.teams.home.id, awayTeamId: f.teams.away.id };
      }
    } catch(e) { console.warn('[validate-extras] AF data erro:', e.message); }
  }
  return null;
};

// ── ESPN ─────────────────────────────────────────────────────────────────────
// Tenta múltiplas ligas ESPN e múltiplos dias para achar qualquer partida
const ESPN_LEAGUES = [
  'fifa.worldcup',
  'intl-friendlies',
  'concacaf.nations.league',
  'uefa.nations',
  'all',
];
const ESPN_SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';

const findViaESPN = async (matchDate, nameA, nameB) => {
  const base = matchDate.split('T')[0];
  const days = [0, 1, 2, 3].map(n => {
    const d = new Date(new Date(base).getTime() - n * 86400000);
    return d.toISOString().split('T')[0];
  });
  const minSinceKickoff = (Date.now() - new Date(matchDate).getTime()) / 60000;

  for (const league of ESPN_LEAGUES) {
    for (const d of days) {
      try {
        const ds = d.replace(/-/g, '');
        const url = `${ESPN_SUMMARY_BASE}/${league}/scoreboard?dates=${ds}`;
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        const evts = data.events || [];
        if (evts.length) console.log(`[validate-extras] ESPN ${league} ${ds}: ${evts.length} eventos`);
        for (const ev of evts) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;
          if (!comp.status?.type?.completed && minSinceKickoff < 100) continue;
          const homeC = comp.competitors?.find(c => c.homeAway === 'home');
          const awayC = comp.competitors?.find(c => c.homeAway === 'away');
          if (!homeC || !awayC) continue;
          const h    = homeC.team.displayName, a = awayC.team.displayName;
          const hAlt = ESPN_ABBR[homeC.team.abbreviation] || h;
          const aAlt = ESPN_ABBR[awayC.team.abbreviation] || a;
          const nm = (x,y) => (x===nameA&&y===nameB)||(x===nameB&&y===nameA);
          if (!nm(h,a) && !nm(hAlt,aAlt)) continue;
          const homeIsTeamA = nm(h,a) ? (h===nameA) : (hAlt===nameA);
          console.log(`[validate-extras] ESPN encontrou em ${league}: ${h} vs ${a}`);
          return { source:'espn', league, eventId: ev.id, homeIsTeamA, homeTeamId: homeC.team.id, awayTeamId: awayC.team.id };
        }
      } catch(e) { /* silencia erros de liga inválida */ }
    }
  }
  return null;
};

// ── ESPN summary → events ─────────────────────────────────────────────────────
const fetchESPNEvents = async (eventId, league = 'fifa.worldcup') => {
  const r = await fetch(`${ESPN_SUMMARY_BASE}/${league}/summary?event=${eventId}`);
  if (!r.ok) return [];
  const data = await r.json();
  const events = [];
  for (const play of (data.plays || [])) {
    const tt  = (play.type?.text || play.type?.name || '').toLowerCase();
    const tid = play.team?.id || null;
    const el  = play.clock?.value ? Math.ceil(play.clock.value / 60) : 45;
    if (play.scoringPlay || tt.includes('goal')) {
      events.push({ type:'Goal', detail: tt.includes('own')?'Own Goal':tt.includes('pen')?'Penalty':'Normal Goal', team:{id:tid}, time:{elapsed:el,extra:null} });
    } else if (tt.includes('yellow-red')||tt.includes('second yellow')) {
      events.push({ type:'Card', detail:'Yellow Red Card', team:{id:tid}, time:{elapsed:el,extra:null} });
    } else if (tt.includes('red')) {
      events.push({ type:'Card', detail:'Red Card', team:{id:tid}, time:{elapsed:el,extra:null} });
    } else if (tt.includes('yellow')||tt.includes('caution')||tt.includes('booking')) {
      events.push({ type:'Card', detail:'Yellow Card', team:{id:tid}, time:{elapsed:el,extra:null} });
    }
  }
  // Fallback keyPlays se plays vazio
  if (!events.length) {
    for (const play of (data.keyPlays || [])) {
      const tt  = (play.type?.text || '').toLowerCase();
      const tid = play.team?.id || null;
      const el  = parseInt(play.clock?.displayValue || '45');
      if (tt.includes('goal') || play.scoringPlay)
        events.push({ type:'Goal', detail: tt.includes('own')?'Own Goal':'Normal Goal', team:{id:tid}, time:{elapsed:el,extra:null} });
    }
  }
  console.log(`[validate-extras] ESPN events parseados: ${events.length}`);
  return events;
};

// ── Handler ──────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' };

  const matchId = parseInt(event.queryStringParameters?.match_id);
  if (!matchId) return { statusCode:400, headers, body: JSON.stringify({ error:'match_id obrigatório' }) };

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (!match) return { statusCode:404, headers, body: JSON.stringify({ error:'Jogo não encontrado' }) };

  // Nomes em inglês (para busca nas APIs)
  const nameA = DB_TO_API[match.team_a] || match.team_a;
  const nameB = DB_TO_API[match.team_b] || match.team_b;
  // Nomes em português (para comparação com retorno convertido da API)
  const ptA   = match.team_a;
  const ptB   = match.team_b;
  const scoreA = match.score_a ?? 0;
  const scoreB = match.score_b ?? 0;

  console.log(`[validate-extras] Jogo ${matchId}: ${ptA}(${nameA}) vs ${ptB}(${nameB}), ${scoreA}×${scoreB}, fixture_id=${match.api_fixture_id||'—'}`);

  // 1. Tenta API-Football (fixture ID salvo ou por data)
  let info = await findViaAF(match.match_date, nameA, nameB, ptA, ptB, match.api_fixture_id);
  // 2. Fallback ESPN
  if (!info) info = await findViaESPN(match.match_date, nameA, nameB);

  if (!info) {
    console.warn('[validate-extras] Jogo não encontrado em nenhuma API');
    return { statusCode:200, headers, body: JSON.stringify({ validated:0, error:'Jogo não encontrado nas APIs' }) };
  }

  console.log(`[validate-extras] Encontrado via ${info.source}, homeIsTeamA=${info.homeIsTeamA}`);

  let events = [];
  if (info.source === 'af') {
    const r = await fetch(`${AF_BASE}/fixtures/events?fixture=${info.fixtureId}`, { headers:{ 'x-apisports-key': AF_KEY } });
    if (r.ok) { const d = await r.json(); events = d.response || []; }
    console.log(`[validate-extras] AF eventos: ${events.length}`);
  } else {
    events = await fetchESPNEvents(info.eventId, info.league || 'fifa.worldcup');
  }

  const results = buildResults(events, match.match_status || 'FT', info.homeIsTeamA, info.homeTeamId, info.awayTeamId, scoreA, scoreB);
  console.log('[validate-extras] Resultados:', JSON.stringify(results));

  const validated = [];
  for (const [typeIdStr, result] of Object.entries(results)) {
    const typeId = parseInt(typeIdStr);
    const { error } = await supabase.from('extra_results').upsert(
      { match_id: matchId, extra_type_id: typeId, official_result: result, is_validated: true, validated_at: new Date().toISOString(), validated_by: null },
      { onConflict: 'match_id,extra_type_id' }
    );
    if (error) console.error(`[validate-extras] Upsert tipo ${typeId}:`, error.message);
    else validated.push(typeId);
  }

  if (validated.length > 0) {
    try { await supabase.rpc('fn_recalculate_all_user_scores'); }
    catch(e) { console.error('[validate-extras] recalculate error:', e.message); }
  }

  console.log(`[validate-extras] ${validated.length}/16 inseridos`);
  return { statusCode:200, headers, body: JSON.stringify({ validated: validated.length, source: info.source, events: events.length }) };
};
