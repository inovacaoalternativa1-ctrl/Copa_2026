const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

// ── ESPN ──────────────────────────────────────────────────────────────────────
const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard';
const ESPN_TO_ISO = {
  GER:'DE',NED:'NL',SUI:'CH',POR:'PT',KOR:'KR',CRO:'HR',DEN:'DK',NOR:'NO',SWE:'SE',
  GRE:'GR',MEX:'MX',URU:'UY',RSA:'ZA',ALG:'DZ',CIV:'CI',ENG:'GB',WAL:'GB',SCO:'GB',
  SRB:'RS',IRN:'IR',AUS:'AU',NZL:'NZ',SAU:'SA',
};
const abbr3toISO = a => (ESPN_TO_ISO[a] || a.slice(0,2)).toUpperCase();
const flagToISO = flag => {
  if (!flag) return null;
  const pts = [...flag].map(c => c.codePointAt(0));
  if (pts[0] >= 0x1F1E6 && pts[0] <= 0x1F1FF)
    return (String.fromCharCode(pts[0]-0x1F1E6+65)+String.fromCharCode(pts[1]-0x1F1E6+65)).toUpperCase();
  if (/^[A-Za-z]{2}$/.test(flag)) return flag.toUpperCase();
  return null;
};
const teamsMatch = (m, homeAbbr, awayAbbr) => {
  const isoA = flagToISO(m.team_a_flag), isoB = flagToISO(m.team_b_flag);
  const h = abbr3toISO(homeAbbr), a = abbr3toISO(awayAbbr);
  return (isoA===h && isoB===a) || (isoA===a && isoB===h);
};

// ── API-Football extras ───────────────────────────────────────────────────────
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
  const goals = events.filter(e => e.type==='Goal' && e.detail!=='Missed Penalty');
  const h1Goals = goals.filter(e => e.time.elapsed<=45 && !e.time.extra);
  const h2Goals = goals.filter(e => e.time.elapsed>45 && e.time.elapsed<=90 && !e.time.extra);
  const firstGoal = goals[0];
  const firstScorer = !firstGoal ? 'none'
    : firstGoal.team.id===teamAId ? 'A'
    : firstGoal.team.id===teamBId ? 'B' : 'none';
  const isRed = e => e.type==='Card' && (e.detail==='Red Card' || e.detail==='Yellow Red Card');
  return {
    1:  yn(h1Goals.length>0),
    2:  yn(h2Goals.length>0),
    3:  { team: firstScorer },
    4:  yn(h1Goals.some(e=>e.team.id===teamAId)),
    5:  yn(h1Goals.some(e=>e.team.id===teamBId)),
    6:  yn(events.some(e=>e.type==='Card'&&e.detail==='Yellow Card'&&e.team.id===teamAId)),
    7:  yn(events.some(e=>e.type==='Card'&&e.detail==='Yellow Card'&&e.team.id===teamBId)),
    8:  yn(events.some(isRed)),
    9:  yn(events.some(e=>isRed(e)&&e.team.id===teamAId)),
    10: yn(events.some(e=>isRed(e)&&e.team.id===teamBId)),
    11: yn(events.some(e=>e.type==='Goal'&&(e.detail==='Penalty'||e.detail==='Missed Penalty'))),
    12: yn(scoreA>0 && scoreB>0),
    13: yn(events.filter(e=>e.type==='Card'&&e.detail==='Yellow Card').length>=4),
    14: yn(goals.some(e=>e.detail==='Own Goal')),
    15: yn(status==='AET'||status==='PEN'),
    16: yn(status==='PEN'),
  };
};

// Mapeamento abreviação ESPN (3 letras) → nome em inglês
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

// Busca eventos via ESPN summary (fallback quando API-Football não retorna eventos)
const espnFindAndFetchEvents = async (matchDate, nameA, nameB) => {
  const date = matchDate.split('T')[0];
  const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
  // Se o jogo passou de 100 min há, considera encerrado mesmo sem status "completed"
  const minSinceKickoff = (Date.now() - new Date(matchDate).getTime()) / 60000;
  for (const d of [date, yesterday]) {
    try {
      const espnScoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup/scoreboard?dates=${d.replace(/-/g,'')}`;
      const rs = await fetch(espnScoreboardUrl);
      if (!rs.ok) continue;
      const data = await rs.json();
      for (const ev of (data.events || [])) {
        const comp = ev.competitions?.[0];
        if (!comp) continue;
        // Pula só se ainda em andamento E menos de 100 min do kick-off
        if (!comp.status?.type?.completed && minSinceKickoff < 100) continue;
        const homeC = comp.competitors?.find(c => c.homeAway === 'home');
        const awayC = comp.competitors?.find(c => c.homeAway === 'away');
        if (!homeC || !awayC) continue;
        const h    = homeC.team.displayName, a = awayC.team.displayName;
        const hAlt = ESPN_ABBR_TO_NAME[homeC.team.abbreviation] || h;
        const aAlt = ESPN_ABBR_TO_NAME[awayC.team.abbreviation] || a;
        const nm = (x,y) => (x===nameA&&y===nameB)||(x===nameB&&y===nameA);
        if (!nm(h,a) && !nm(hAlt,aAlt)) continue;
        const homeIsTeamA = nm(h,a) ? (h===nameA) : (hAlt===nameA);
        const homeTeamId  = homeC.team.id;
        const awayTeamId  = awayC.team.id;
        const sum = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.worldcup/summary?event=${ev.id}`);
        if (!sum.ok) return null;
        const sd = await sum.json();
        const events = [];
        for (const play of (sd.plays || [])) {
          const tt = (play.type?.text || '').toLowerCase();
          const tid = play.team?.id || null;
          const el  = play.clock?.value ? Math.ceil(play.clock.value / 60) : 45;
          if (play.scoringPlay || tt.includes('goal')) {
            events.push({ type:'Goal', detail: tt.includes('own')?'Own Goal':tt.includes('pen')?'Penalty':'Normal Goal', team:{id:tid}, time:{elapsed:el,extra:null} });
          } else if (tt.includes('red')) {
            events.push({ type:'Card', detail: tt.includes('yellow')?'Yellow Red Card':'Red Card', team:{id:tid}, time:{elapsed:el,extra:null} });
          } else if (tt.includes('yellow')||tt.includes('caution')||tt.includes('booking')) {
            events.push({ type:'Card', detail:'Yellow Card', team:{id:tid}, time:{elapsed:el,extra:null} });
          }
        }
        console.log(`[sync-scores] ESPN events para ${nameA} vs ${nameB}: ${events.length}`);
        return { events, homeIsTeamA, homeTeamId, awayTeamId };
      }
    } catch(e) { console.warn('[sync-scores] ESPN events erro:', e.message); }
  }
  return null;
};

const autoValidateExtras = async (supabase, match, scoreA, scoreB, afFixtureId) => {
  const API_KEY = process.env.REACT_APP_API_FOOTBALL_KEY;
  try {
    let homeIsTeamA, homeTeamId, awayTeamId, events = [], status = 'FT';
    const nameA = DB_TO_API[match.team_a] || match.team_a;
    const nameB = DB_TO_API[match.team_b] || match.team_b;
    // Usa o ID passado ou o salvo no banco durante a fase ao vivo
    const fixtureId = afFixtureId || match.api_fixture_id;

    // 1. API-Football com fixture ID (passado ou guardado no banco)
    if (fixtureId && API_KEY) {
      const r = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, { headers: { 'x-apisports-key': API_KEY } });
      if (r.ok) {
        const d = await r.json();
        const fixture = d.response?.[0];
        if (fixture) {
          homeIsTeamA = fixture.teams.home.name === nameA;
          homeTeamId  = fixture.teams.home.id;
          awayTeamId  = fixture.teams.away.id;
          status      = fixture.fixture.status.short;
          const evRes = await fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`, { headers: { 'x-apisports-key': API_KEY } });
          if (evRes.ok) events = (await evRes.json()).response || [];
        }
      }
    }

    // 2. API-Football por data (fallback quando não tem fixture ID)
    if (!events.length && API_KEY) {
      const date = match.match_date.split('T')[0];
      for (const ds of [date, new Date(new Date(date).getTime()-86400000).toISOString().split('T')[0]]) {
        const r = await fetch(`https://v3.football.api-sports.io/fixtures?date=${ds}`, { headers: { 'x-apisports-key': API_KEY } });
        if (!r.ok) continue;
        const fixture = (await r.json()).response?.find(f => {
          const h=f.teams.home.name, a=f.teams.away.name;
          return (h===nameA&&a===nameB)||(h===nameB&&a===nameA);
        });
        if (!fixture) continue;
        homeIsTeamA = fixture.teams.home.name === nameA;
        homeTeamId  = fixture.teams.home.id;
        awayTeamId  = fixture.teams.away.id;
        status      = fixture.fixture.status.short;
        const evRes = await fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${fixture.fixture.id}`, { headers: { 'x-apisports-key': API_KEY } });
        if (evRes.ok) events = (await evRes.json()).response || [];
        break;
      }
    }

    // 3. API-Football pelos últimos jogos do time (funciona mesmo após encerrar)
    if (!events.length && API_KEY) {
      try {
        const teamRes = await fetch(`https://v3.football.api-sports.io/teams?name=${encodeURIComponent(nameA)}`, { headers:{ 'x-apisports-key': API_KEY } });
        if (teamRes.ok) {
          const teamId = (await teamRes.json()).response?.[0]?.team?.id;
          if (teamId) {
            const fxRes = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=10`, { headers:{ 'x-apisports-key': API_KEY } });
            if (fxRes.ok) {
              const fixture = (await fxRes.json()).response?.find(f => {
                const h=f.teams.home.name, a=f.teams.away.name;
                return (h===nameA&&a===nameB)||(h===nameB&&a===nameA)||
                       (norm(resolveTeam(h))===norm(match.team_a)&&norm(resolveTeam(a))===norm(match.team_b))||
                       (norm(resolveTeam(h))===norm(match.team_b)&&norm(resolveTeam(a))===norm(match.team_a));
              });
              if (fixture) {
                homeIsTeamA = fixture.teams.home.name === nameA || resolveTeam(fixture.teams.home.name) === match.team_a;
                homeTeamId  = fixture.teams.home.id;
                awayTeamId  = fixture.teams.away.id;
                status      = fixture.fixture.status.short;
                const evRes = await fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${fixture.fixture.id}`, { headers:{ 'x-apisports-key': API_KEY } });
                if (evRes.ok) events = (await evRes.json()).response || [];
                console.log(`[sync-scores] AF team/last10: fixture ${fixture.fixture.id}, ${events.length} eventos`);
              }
            }
          }
        }
      } catch(e) { console.warn('[sync-scores] AF team/last erro:', e.message); }
    }

    // 4. ESPN como fallback final (público, sem chave)
    if (!events.length) {
      const espn = await espnFindAndFetchEvents(match.match_date, nameA, nameB);
      if (espn) { events = espn.events; homeIsTeamA = espn.homeIsTeamA; homeTeamId = espn.homeTeamId; awayTeamId = espn.awayTeamId; }
    }

    if (homeIsTeamA === undefined) {
      console.log(`[sync-scores] extras: jogo ${match.id} não encontrado em nenhuma API`);
      return;
    }

    const results = buildResults(events, status, homeIsTeamA, homeTeamId, awayTeamId, scoreA, scoreB);
    for (const [typeId, result] of Object.entries(results)) {
      await supabase.from('extra_results').upsert({
        match_id: match.id, extra_type_id: parseInt(typeId),
        official_result: result, is_validated: true,
        validated_at: new Date().toISOString(), validated_by: null,
      }, { onConflict: 'match_id,extra_type_id' });
    }
    console.log(`[sync-scores] extras validados para jogo ${match.id} (${events.length} eventos, fonte: ${events.length ? (afFixtureId?'AF-live':'AF-date/ESPN') : 'sem-eventos'})`);
  } catch(e) {
    console.error('[sync-scores] extras error:', e.message);
  }
};

// ── Handler principal (executado a cada 5 min pelo Netlify) ──────────────────
exports.handler = async () => {
  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  webpush.setVapidDetails(
    'mailto:admin@copasimuada.com',
    process.env.REACT_APP_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  // Busca jogos ainda não encerrados
  const { data: matches } = await supabase.from('matches').select('*').eq('is_finished', false);
  if (!matches?.length) return { statusCode: 200, body: JSON.stringify({ updated: 0, matches: [], body: 'Nenhum jogo pendente' }) };

  // Filtra apenas jogos que já começaram (ou começam em até 30 min) — sem limite máximo
  const now = Date.now();
  const activeMatches = matches.filter(m => {
    const diff = (now - new Date(m.match_date).getTime()) / 60000;
    return diff >= -30; // já começou ou começa em breve
  });
  if (!activeMatches.length) return { statusCode: 200, body: JSON.stringify({ updated: 0, matches: [], body: 'Nenhum jogo iniciado ainda' }) };

  // ── API-Football: fixtures ao vivo na Copa 2026 ──────────────────────────
  const AF_KEY = process.env.REACT_APP_API_FOOTBALL_KEY;
  if (!AF_KEY) return { statusCode: 200, body: JSON.stringify({ updated: 0, matches: [], body: 'REACT_APP_API_FOOTBALL_KEY não configurada' }) };

  // Mapeamento reverso: nome em inglês → nome no banco
  const norm = s => (s || '').normalize('NFC').trim();
  const API_TO_DB = Object.fromEntries(
    Object.entries(DB_TO_API).map(([db, en]) => [norm(en), norm(db)])
  );

  // Mapeamento com Unicode-escapes nos valores — imune a encoding do arquivo
  // í=í  ç=ç  é=é  á=á  Á=Á  ó=ó
  // ô=ô  ã=ã  â=â  õ=õ  í=í
  const SAFE_OVERRIDES = {
    'Switzerland':            'Suíça',
    'France':                 'França',
    'Belgium':                'Bélgica',
    'Italy':                  'Itália',
    'Croatia':                'Croácia',
    'Sweden':                 'Suécia',
    'Austria':                'Áustria',
    'Scotland':               'Escócia',
    'Mexico':                 'México',
    'Canada':                 'Canadá',
    'Colombia':               'Colômbia',
    'Bolivia':                'Bolívia',
    'Cameroon':               'Camarões',
    'South Africa':           'África do Sul',
    'Tunisia':                'Tunísia',
    'Algeria':                'Argélia',
    'Nigeria':                'Nigéria',
    'Japan':                  'Japão',
    'Australia':              'Austrália',
    'Iran':                   'Irã',
    'IR Iran':                'Irã',
    'Saudi Arabia':           'Arábia Saudita',
    'Jordan':                 'Jordânia',
    'Uzbekistan':             'Uzbequistão',
    'New Zealand':            'Nova Zelândia',
    'Bosnia and Herzegovina': 'Bósnia',
    'Bosnia':                 'Bósnia',
    'Czechia':                'Tchéquia',
    'Czech Republic':         'Tchéquia',
    'Czech Rep.':             'Tchéquia',
    'Curacao':                'Curaçao',
    'Panama':                 'Panamá',
    'Korea Republic':         'Coreia do Sul',
    'Korea, South':           'Coreia do Sul',
    'South Korea':            'Coreia do Sul',
    'USA':                    'Estados Unidos',
    'United States':          'Estados Unidos',
    'Ivory Coast':            'Costa do Marfim',
    "Cote d'Ivoire":          'Costa do Marfim',
    'DR Congo':               'RD Congo',
    'Congo DR':               'RD Congo',
    'Netherlands':            'Holanda',
    'Holland':                'Holanda',
    'Cape Verde':             'Cabo Verde',
  };
  // SAFE_OVERRIDES tem prioridade — usa Unicode escapes para evitar problema de encoding
  Object.assign(API_TO_DB, SAFE_OVERRIDES);

  const resolveTeam = name => {
    const n = norm(name);
    return API_TO_DB[n] || n;
  };
  const COMPLETED = new Set(['FT','AET','PEN']);
  const LIVE      = new Set(['1H','HT','2H','ET','BT','P','LIVE']);

  let fixtures = [];
  try {
    // Busca TODOS os jogos ao vivo (sem filtro de liga — plano free não suporta histórico)
    const liveRes = await fetch(
      'https://v3.football.api-sports.io/fixtures?live=all',
      { headers: { 'x-apisports-key': AF_KEY } }
    );
    if (liveRes.ok) {
      const liveData = await liveRes.json();
      // Filtra só jogos que batem com algum time do banco
      const allLive = liveData.response || [];
      fixtures = allLive.filter(f => {
        const h = resolveTeam(f.teams.home.name);
        const a = resolveTeam(f.teams.away.name);
        return activeMatches.some(m =>
          (norm(m.team_a) === h && norm(m.team_b) === a) ||
          (norm(m.team_a) === a && norm(m.team_b) === h)
        );
      }).map(f => ({ ...f, _afId: f.fixture.id }));
    }

    // Fallback 1: API-Football por data sem filtro de liga
    if (!fixtures.length) {
      const today     = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const [r1, r2] = await Promise.all([
        fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`,     { headers: { 'x-apisports-key': AF_KEY } }),
        fetch(`https://v3.football.api-sports.io/fixtures?date=${yesterday}`, { headers: { 'x-apisports-key': AF_KEY } }),
      ]);
      const d1 = r1.ok ? ((await r1.json()).response || []) : [];
      const d2 = r2.ok ? ((await r2.json()).response || []) : [];
      const seen = new Set();
      fixtures = [...d1, ...d2].filter(f => {
        if (seen.has(f.fixture.id)) return false;
        seen.add(f.fixture.id);
        if (!COMPLETED.has(f.fixture.status.short)) return false;
        const h = resolveTeam(f.teams.home.name);
        const a = resolveTeam(f.teams.away.name);
        return activeMatches.some(m =>
          (norm(m.team_a) === h && norm(m.team_b) === a) ||
          (norm(m.team_a) === a && norm(m.team_b) === h)
        );
      }).map(f => ({ ...f, _afId: f.fixture.id }));
      console.log(`[sync-scores] AF fallback: today=${d1.length} yesterday=${d2.length} match=${fixtures.length}`);
    }

    // Fallback 2: football-data.org — retorna histórico completo da Copa (plano free)
    const FD_KEY = process.env.FOOTBALL_DATA_KEY;
    if (!fixtures.length && FD_KEY) {
      try {
        const fdRes = await fetch(
          'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
          { headers: { 'X-Auth-Token': FD_KEY } }
        );
        if (fdRes.ok) {
          const fdData = await fdRes.json();
          const fdMatches = (fdData.matches || []).filter(m => {
            const h = resolveTeam(m.homeTeam.name);
            const a = resolveTeam(m.awayTeam.name);
            return activeMatches.some(am =>
              (norm(am.team_a) === h && norm(am.team_b) === a) ||
              (norm(am.team_a) === a && norm(am.team_b) === h)
            );
          });
          // Converte para o formato do API-Football para o restante do código funcionar igual
          fixtures = fdMatches.map(m => ({
            fixture: { id: m.id, status: { short: 'FT', elapsed: 90 } },
            teams:   { home: { name: m.homeTeam.name, id: m.homeTeam.id }, away: { name: m.awayTeam.name, id: m.awayTeam.id } },
            goals:   { home: m.score.fullTime.home, away: m.score.fullTime.away },
          }));
          console.log(`[sync-scores] football-data.org: ${fdMatches.length} jogo(s) encerrado(s) encontrado(s)`);
        }
      } catch(e) {
        console.error('[sync-scores] football-data.org erro:', e.message);
      }
    }

    // Fallback 3: ESPN public scoreboard (sem chave, retorna jogos encerrados)
    if (!fixtures.length) {
      try {
        const fmt = d => d.toISOString().split('T')[0].replace(/-/g, '');
        for (const ds of [fmt(new Date()), fmt(new Date(Date.now() - 86400000))]) {
          const r = await fetch(`${ESPN_URL}?dates=${ds}`);
          if (!r.ok) continue;
          const data = await r.json();
          for (const ev of (data.events || [])) {
            const comp = ev.competitions?.[0];
            if (!comp?.status?.type?.completed) continue;
            const homeC = comp.competitors?.find(c => c.homeAway === 'home');
            const awayC = comp.competitors?.find(c => c.homeAway === 'away');
            if (!homeC || !awayC) continue;
            const h = resolveTeam(homeC.team.displayName);
            const a = resolveTeam(awayC.team.displayName);
            if (!activeMatches.some(m =>
              (norm(m.team_a) === h && norm(m.team_b) === a) ||
              (norm(m.team_a) === a && norm(m.team_b) === h)
            )) continue;
            fixtures.push({
              fixture: { id: null, status: { short: 'FT', elapsed: 90 } },
              teams:   { home: { name: homeC.team.displayName, id: null }, away: { name: awayC.team.displayName, id: null } },
              goals:   { home: parseInt(homeC.score || 0), away: parseInt(awayC.score || 0) },
            });
          }
          if (fixtures.length) { console.log(`[sync-scores] ESPN fallback: ${fixtures.length} jogo(s)`); break; }
        }
      } catch(e) {
        console.error('[sync-scores] ESPN fallback erro:', e.message);
      }
    }
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ updated: 0, matches: [], body: `API-Football erro: ${e.message}` }) };
  }

  if (!fixtures.length) {
    const pendingNames = activeMatches.map(m => `${m.team_a} × ${m.team_b}`).join(', ');
    return { statusCode: 200, body: JSON.stringify({ updated: 0, matches: [], body: `API-Football não retornou jogos. Pendentes no banco: ${pendingNames}` }) };
  }

  const { data: subs } = await supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  const updated = [];

  for (const f of fixtures) {
    const status      = f.fixture.status.short;
    const isCompleted = COMPLETED.has(status);
    const isLive      = LIVE.has(status);
    if (!isCompleted && !isLive) continue;

    const homeNameEn = f.teams.home.name;
    const awayNameEn = f.teams.away.name;
    const homeNameDb = resolveTeam(homeNameEn);
    const awayNameDb = resolveTeam(awayNameEn);

    const match = activeMatches.find(m =>
      (norm(m.team_a) === homeNameDb && norm(m.team_b) === awayNameDb) ||
      (norm(m.team_a) === awayNameDb && norm(m.team_b) === homeNameDb)
    );
    if (!match) {
      console.warn(`[sync-scores] sem match para: ${homeNameEn} vs ${awayNameEn}`);
      continue;
    }

    const homeIsTeamA = norm(match.team_a) === homeNameDb;
    const scoreA = homeIsTeamA ? (f.goals.home ?? 0) : (f.goals.away ?? 0);
    const scoreB = homeIsTeamA ? (f.goals.away ?? 0) : (f.goals.home ?? 0);

    const { error } = await supabase.from('matches').update({
      score_a: scoreA, score_b: scoreB,
      is_finished: isCompleted,
      is_locked: true,
      match_status: status,
      elapsed_time: f.fixture.status.elapsed ?? null,
      ...(f._afId ? { api_fixture_id: f._afId } : {}),
    }).eq('id', match.id);

    if (error) { console.error('[sync-scores] update error:', error.message); continue; }

    if (isCompleted) {
      updated.push({ match, scoreA, scoreB });
      await autoValidateExtras(supabase, match, scoreA, scoreB, f._afId || null);
    } else {
      console.log(`[sync-scores] ao vivo (${status}): ${match.team_a} ${scoreA}×${scoreB} ${match.team_b}`);
    }
  }

  // Auto-close: jogos presos como "ao vivo" há mais de 150 min do kick-off
  // (150 min é impossível para qualquer partida real, incluindo prorrogação + pênaltis)
  const TIMEOUT_MIN = 150;
  for (const m of activeMatches) {
    const minElapsed = (now - new Date(m.match_date).getTime()) / 60000;
    if (minElapsed < TIMEOUT_MIN) continue;
    if (updated.some(u => u.match.id === m.id)) continue; // já atualizado neste ciclo
    const scoreA = m.score_a ?? 0;
    const scoreB = m.score_b ?? 0;
    console.warn(`[sync-scores] auto-close timeout (${Math.round(minElapsed)}min): ${m.team_a} ${scoreA}×${scoreB} ${m.team_b}`);
    const { error: tcErr } = await supabase.from('matches').update({
      is_finished: true, is_locked: true, match_status: 'FT', elapsed_time: 90,
    }).eq('id', m.id);
    if (!tcErr) {
      updated.push({ match: m, scoreA, scoreB });
      await autoValidateExtras(supabase, m, scoreA, scoreB, null);
    }
  }

  // Recalcula pontuações de todos os usuários se algum jogo foi encerrado
  if (updated.length > 0) {
    try {
      await supabase.rpc('fn_recalculate_all_user_scores');
      console.log('[sync-scores] pontuações recalculadas');
    } catch(e) {
      console.error('[sync-scores] recalculate error:', e.message);
    }
  }

  // Envia push notifications para cada resultado novo
  for (const { match, scoreA, scoreB } of updated) {
    const payload = JSON.stringify({
      title: '⚽ Placar Atualizado!',
      body: `${match.team_a} ${scoreA} × ${scoreB} ${match.team_b}`,
    });
    for (const sub of (subs||[])) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch(e) {
        if (e.statusCode===410)
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }

  const summary = updated.map(u=>`${u.match.team_a} ${u.scoreA}×${u.scoreB} ${u.match.team_b}`);
  console.log(`[sync-scores] ${updated.length} resultado(s) sincronizado(s):`, summary.join(' · '));
  return { statusCode: 200, body: JSON.stringify({ updated: updated.length, matches: summary }) };
};
