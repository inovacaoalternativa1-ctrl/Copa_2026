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

const autoValidateExtras = async (supabase, match, scoreA, scoreB) => {
  const API_KEY = process.env.REACT_APP_API_FOOTBALL_KEY;
  if (!API_KEY) return;
  try {
    const date = match.match_date.split('T')[0];
    const fixtRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${date}&league=1&season=2026`,
      { headers: { 'x-apisports-key': API_KEY } }
    );
    if (!fixtRes.ok) return;
    const fixtData = await fixtRes.json();
    const nameA = DB_TO_API[match.team_a] || match.team_a;
    const nameB = DB_TO_API[match.team_b] || match.team_b;
    const fixture = (fixtData.response||[]).find(f => {
      const h = f.teams.home.name, a = f.teams.away.name;
      return (h===nameA&&a===nameB)||(h===nameB&&a===nameA);
    });
    if (!fixture) return;
    const evRes = await fetch(
      `https://v3.football.api-sports.io/fixtures/events?fixture=${fixture.fixture.id}`,
      { headers: { 'x-apisports-key': API_KEY } }
    );
    if (!evRes.ok) return;
    const evData = await evRes.json();
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
  if (!matches?.length) return { statusCode: 200, body: 'Nenhum jogo pendente' };

  // Só prossegue se houver jogo dentro da janela ativa:
  // começou há menos de 3h OU começa nos próximos 30 min
  const now = Date.now();
  const hasActiveWindow = matches.some(m => {
    const diff = (now - new Date(m.match_date).getTime()) / 60000; // minutos desde o início
    return diff >= -30 && diff <= 180;
  });
  if (!hasActiveWindow) return { statusCode: 200, body: 'Nenhum jogo na janela ativa' };

  // Consulta ESPN
  let espnData;
  try {
    const res = await fetch(ESPN_URL);
    if (!res.ok) {
      if (res.status===400 || res.status===404)
        return { statusCode: 200, body: 'Sem jogos ao vivo hoje' };
      return { statusCode: 200, body: `ESPN ${res.status}` };
    }
    espnData = await res.json();
  } catch(e) {
    return { statusCode: 500, body: e.message };
  }

  // Jogos encerrados E em andamento
  const activeGames = (espnData.events||[]).filter(ev => {
    const s = ev.competitions?.[0]?.status?.type;
    return s?.completed === true || s?.state === 'in';
  });
  if (!activeGames.length) return { statusCode: 200, body: 'Nenhum jogo ativo na ESPN' };

  const { data: subs } = await supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  const updated = [];

  for (const ev of activeGames) {
    const comp = ev.competitions[0];
    const isCompleted = comp.status?.type?.completed === true;
    const homeC = comp.competitors.find(c=>c.homeAway==='home');
    const awayC = comp.competitors.find(c=>c.homeAway==='away');
    if (!homeC||!awayC) continue;

    const evTime = new Date(ev.date).getTime();
    const scoreA = parseInt(homeC.score)||0;
    const scoreB = parseInt(awayC.score)||0;

    let candidates = matches.filter(
      m => Math.abs(new Date(m.match_date).getTime()-evTime)/60000 < 150
    );
    if (candidates.length>1) {
      const narrow = candidates.filter(
        m => teamsMatch(m, homeC.team.abbreviation, awayC.team.abbreviation)
      );
      if (narrow.length===1) candidates = narrow;
    }
    if (candidates.length!==1) continue;
    const match = candidates[0];

    const { error } = await supabase.from('matches').update({
      score_a: scoreA, score_b: scoreB,
      is_finished: isCompleted,
      is_locked: true,
      updated_at: new Date().toISOString(),
    }).eq('id', match.id);

    if (error) { console.error('[sync-scores] update error:', error.message); continue; }

    if (isCompleted) {
      updated.push({ match, scoreA, scoreB });
      await autoValidateExtras(supabase, match, scoreA, scoreB);
    } else {
      console.log(`[sync-scores] placar ao vivo: ${match.team_a} ${scoreA}×${scoreB} ${match.team_b}`);
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
