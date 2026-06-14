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

// Abreviação ESPN (3 letras) → nome em inglês
const ESPN_ABBR_TO_NAME = {
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

// Tenta API-Football — primeiro pelo fixture ID guardado, depois por data
const findViaAF = async (matchDate, nameA, nameB, savedFixtureId = null) => {
  if (!AF_KEY) return null;
  const API_TO_DB = Object.fromEntries(Object.entries(DB_TO_API).map(([db, en]) => [en, db]));
  const apiToDb = n => API_TO_DB[n] || n;

  // 1. Tenta pelo fixture ID guardado no banco (mais confiável)
  if (savedFixtureId) {
    try {
      const r = await fetch(`${AF_BASE}/fixtures?id=${savedFixtureId}`, { headers: { 'x-apisports-key': AF_KEY } });
      if (r.ok) {
        const data = await r.json();
        const f = data.response?.[0];
        if (f) {
          console.log(`[validate-extras] AF fixture direto: ${f.teams.home.name} vs ${f.teams.away.name}`);
          const h = f.teams.home.name, a = f.teams.away.name;
          return { source: 'af', fixtureId: savedFixtureId, homeIsTeamA: h === nameA, homeTeamId: f.teams.home.id, awayTeamId: f.teams.away.id };
        }
      }
    } catch(e) { console.warn('[validate-extras] AF fixture direto erro:', e.message); }
  }

  // 2. Busca por data (hoje e ontem)
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
        return (h === nameA && a === nameB) || (h === nameB && a === nameA);
      });
      if (f) {
        return { source: 'af', fixtureId: f.fixture.id, homeIsTeamA: apiToDb(f.teams.home.name) === nameA, homeTeamId: f.teams.home.id, awayTeamId: f.teams.away.id };
      }
    } catch(e) { console.warn('[validate-extras] AF data erro:', e.message); }
  }
  return null;
};

// Tenta ESPN scoreboard — match por displayName E por abreviação
const findViaESPN = async (matchDate, nameA, nameB) => {
  const date = matchDate.split('T')[0];
  const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
  const minSinceKickoff = (Date.now() - new Date(matchDate).getTime()) / 60000;
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
        // Pula se ainda em andamento E menos de 100 min do kick-off
        if (!comp.status?.type?.completed && minSinceKickoff < 100) continue;
        const homeC = comp.competitors?.find(c => c.homeAway === 'home');
        const awayC = comp.competitors?.find(c => c.homeAway === 'away');
        if (!homeC || !awayC) continue;
        const h    = homeC.team.displayName, a = awayC.team.displayName;
        const hAlt = ESPN_ABBR_TO_NAME[homeC.team.abbreviation] || h;
        const aAlt = ESPN_ABBR_TO_NAME[awayC.team.abbreviation] || a;
        console.log(`[validate-extras] ESPN: ${h}(${homeC.team.abbreviation}) vs ${a}(${awayC.team.abbreviation})`);
        const nm = (x,y) => (x===nameA&&y===nameB)||(x===nameB&&y===nameA);
        if (!nm(h,a) && !nm(hAlt,aAlt)) continue;
        const homeIsTeamA = nm(h,a) ? (h===nameA) : (hAlt===nameA);
        return { source: 'espn', eventId: ev.id, homeIsTeamA, homeTeamId: homeC.team.id, awayTeamId: awayC.team.id };
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
  for (const play of (data.plays || [])) {
    const typeText = (play.type?.text || play.type?.name || '').toLowerCase();
    const teamId = play.team?.id || null;
    const elapsed = play.clock?.value ? Math.ceil(play.clock.value / 60) : 45;
    if (play.scoringPlay || typeText.includes('goal')) {
      events.push({ type:'Goal', detail: typeText.includes('own')?'Own Goal':typeText.includes('pen')?'Penalty':'Normal Goal', team:{id:teamId}, time:{elapsed,extra:null} });
    } else if (typeText.includes('yellow-red')||typeText.includes('second yellow')) {
      events.push({ type:'Card', detail:'Yellow Red Card', team:{id:teamId}, time:{elapsed,extra:null} });
    } else if (typeText.includes('red')) {
      events.push({ type:'Card', detail:'Red Card', team:{id:teamId}, time:{elapsed,extra:null} });
    } else if (typeText.includes('yellow')||typeText.includes('caution')||typeText.includes('booking')) {
      events.push({ type:'Card', detail:'Yellow Card', team:{id:teamId}, time:{elapsed,extra:null} });
    }
  }
  // Fallback: keyPlays se plays vazio
  if (!events.length) {
    for (const play of (data.keyPlays || [])) {
      const typeText = (play.type?.text || '').toLowerCase();
      const teamId = play.team?.id || null;
      const elapsed = parseInt(play.clock?.displayValue || '45');
      if (typeText.includes('goal') || play.scoringPlay) {
        events.push({ type:'Goal', detail:typeText.includes('own')?'Own Goal':'Normal Goal', team:{id:teamId}, time:{elapsed,extra:null} });
      }
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

  console.log(`[validate-extras] Jogo ${matchId}: ${match.team_a}(${nameA}) vs ${match.team_b}(${nameB}), ${scoreA}×${scoreB}, fixture_id=${match.api_fixture_id||'—'}`);

  // 1. Tenta API-Football (usando fixture ID guardado se disponível)
  let info = await findViaAF(match.match_date, nameA, nameB, match.api_fixture_id);
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

  const results = buildResults(events, match.match_status || 'FT', info.homeIsTeamA, info.homeTeamId, info.awayTeamId, scoreA, scoreB);
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

  // Recalcula pontuações de todos os usuários
  if (validated.length > 0) {
    try {
      await supabase.rpc('fn_recalculate_all_user_scores');
      console.log('[validate-extras] pontuações recalculadas');
    } catch(e) {
      console.error('[validate-extras] recalculate error:', e.message);
    }
  }

  console.log(`[validate-extras] ${validated.length}/16 extras inseridos`);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ validated: validated.length, source: info.source, events: events.length, rawInfo }),
  };
};
