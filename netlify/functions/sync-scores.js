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

const autoValidateExtras = async (supabase, match, scoreA, scoreB, afFixtureId) => {
  const API_KEY = process.env.REACT_APP_API_FOOTBALL_KEY;
  if (!API_KEY) return;
  try {
    let fixture = null;

    if (afFixtureId) {
      // ID já conhecido (jogo foi detectado ao vivo) — busca direto
      const r = await fetch(
        `https://v3.football.api-sports.io/fixtures?id=${afFixtureId}`,
        { headers: { 'x-apisports-key': API_KEY } }
      );
      if (!r.ok) return;
      const d = await r.json();
      fixture = d.response?.[0] || null;
    } else {
      // Fallback: busca por data sem filtro de liga (free plan)
      const date = match.match_date.split('T')[0];
      const nameA = DB_TO_API[match.team_a] || match.team_a;
      const nameB = DB_TO_API[match.team_b] || match.team_b;
      for (const dateStr of [date, new Date(new Date(date).getTime()-86400000).toISOString().split('T')[0]]) {
        const r = await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${dateStr}`,
          { headers: { 'x-apisports-key': API_KEY } }
        );
        if (!r.ok) continue;
        const d = await r.json();
        fixture = (d.response||[]).find(f => {
          const h = f.teams.home.name, a = f.teams.away.name;
          return (h===nameA&&a===nameB)||(h===nameB&&a===nameA);
        }) || null;
        if (fixture) break;
      }
    }

    if (!fixture) {
      console.log(`[sync-scores] extras: fixture não encontrado para jogo ${match.id}`);
      return;
    }

    const evRes = await fetch(
      `https://v3.football.api-sports.io/fixtures/events?fixture=${fixture.fixture.id}`,
      { headers: { 'x-apisports-key': API_KEY } }
    );
    if (!evRes.ok) return;
    const evData = await evRes.json();
    const nameA = DB_TO_API[match.team_a] || match.team_a;
    const homeIsTeamA = fixture.teams.home.name === nameA;
    const results = buildResults(
      evData.response||[], fixture.fixture.status.short,
      homeIsTeamA, fixture.teams.home.id, fixture.teams.away.id, scoreA, scoreB
    );
    for (const [typeId, result] of Object.entries(results)) {
      await supabase.from('extra_results').upsert({
        match_id: match.id,
        extra_type_id: parseInt(typeId),
        official_result: result,
        is_validated: true,
        validated_at: new Date().toISOString(),
        validated_by: null,
      }, { onConflict: 'match_id,extra_type_id' });
    }
    console.log(`[sync-scores] extras validados para jogo ${match.id}`);
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
  // normalize('NFC') garante que acentos com encodings diferentes comparem igual
  const norm = s => (s || '').normalize('NFC').trim();
  const API_TO_DB = Object.fromEntries(
    Object.entries(DB_TO_API).map(([db, en]) => [norm(en), norm(db)])
  );

  // Aliases que a API-Football usa e que diferem do mapeamento padrão
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
    'El Salvador':'El Salvador',
  };
  const resolveTeam = name => {
    const n = norm(name);
    return API_TO_DB[n] || API_ALIASES[n] || n;
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
              (am.team_a === h && am.team_b === a) || (am.team_a === a && am.team_b === h)
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
    }).eq('id', match.id);

    if (error) { console.error('[sync-scores] update error:', error.message); continue; }

    if (isCompleted) {
      updated.push({ match, scoreA, scoreB });
      await autoValidateExtras(supabase, match, scoreA, scoreB, f._afId || null);
    } else {
      console.log(`[sync-scores] ao vivo (${status}): ${match.team_a} ${scoreA}×${scoreB} ${match.team_b}`);
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
