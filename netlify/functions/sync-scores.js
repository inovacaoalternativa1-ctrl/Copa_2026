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
const norm = s => (s || '').normalize('NFC').trim();

// Reverse lookup: API English name → Portuguese DB name (usado por autoValidateExtras e espnFindAndFetchEvents)
const API_TO_DB_BASE = Object.fromEntries(Object.entries(DB_TO_API).map(([db, en]) => [en, db]));
const resolveToDb = name => API_TO_DB_BASE[norm(name)] || name;

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

// Quando a fixture é achada mas a API não retorna nenhum evento (gol/cartão), não dá
// pra afirmar que "nada aconteceu" — isso geraria falso "Não"/"Nenhum" pra quem acertou
// extras que realmente ocorreram. Nesse caso valida só o que é dedutível pelo placar
// final, deixando o resto pendente (sem sobrescrever com um palpite errado).
const buildScoreOnlyResults = (scoreA, scoreB, status) => {
  const out = {};
  if (scoreA > 0 && scoreB === 0) out[3] = { team: 'A' };
  else if (scoreB > 0 && scoreA === 0) out[3] = { team: 'B' };
  else if (scoreA === 0 && scoreB === 0) out[3] = { team: 'none' };
  if (scoreA === 0) out[4] = { answer: 'no' };
  if (scoreB === 0) out[5] = { answer: 'no' };
  out[12] = yn(scoreA > 0 && scoreB > 0);
  out[15] = yn(status === 'AET' || status === 'PEN');
  out[16] = yn(status === 'PEN');
  return out;
};

// ── Palpite da Sorte (Brasil x Noruega) — feature isolada, não toca em "matches" ──
// Reaproveita os fixtures que a Etapa 1 (live) e Etapa 2 (por data) já buscam pra
// detectar esse jogo específico sem gastar requisição extra na API-Football.
const isLuckyFixture = (f) => {
  const h = f.teams.home.name, a = f.teams.away.name;
  return (h === 'Brazil' && a === 'Norway') || (h === 'Norway' && a === 'Brazil');
};

const LUCKY_PLAYERS = [
  ['Alisson','brasil'],['Ederson','brasil'],['Weverton','brasil'],
  ['Alex Sandro','brasil'],['Bremer','brasil'],['Danilo','brasil'],['Marquinhos','brasil'],
  ['Douglas Santos','brasil'],['Gabriel Magalhães','brasil'],['Ibañez','brasil'],['Léo Pereira','brasil'],
  ['Bruno Guimarães','brasil'],['Casemiro','brasil'],['Lucas Paquetá','brasil'],['Danilo Santos','brasil'],['Éderson','brasil'],['Fabinho','brasil'],
  ['Neymar Júnior','brasil'],['Raphinha','brasil'],['Vinícius Júnior','brasil'],['Endrick','brasil'],['Gabriel Martinelli','brasil'],
  ['Igor Thiago','brasil'],['Luiz Henrique','brasil'],['Matheus Cunha','brasil'],['Rayan','brasil'],
  ['Ørjan Nyland','noruega'],['Sander Tangvik','noruega'],['Egil Selvik','noruega'],
  ['Julian Ryerson','noruega'],['Leo Østigard','noruega'],['Kristoffer Ajer','noruega'],['Fredrik André Bjørkan','noruega'],
  ['Marcus Holmgren Pedersen','noruega'],['Torbjørn Heggem','noruega'],['Sondre Langas','noruega'],['Henrik Falchener','noruega'],['David Møller Wolfe','noruega'],
  ['Martin Ødegaard','noruega'],['Sander Berge','noruega'],['Morten Thorsby','noruega'],['Fredrik Aursnes','noruega'],['Kristian Thorstvedt','noruega'],['Thelo Aasgaard','noruega'],['Oscar Bobb','noruega'],['Jens Petter Hauge','noruega'],['Patrick Berg','noruega'],
  ['Erling Haaland','noruega'],['Alexander Sørloth','noruega'],['Antonio Nusa','noruega'],['Jørgen Strand Larsen','noruega'],['Andreas Schjelderup','noruega'],
];
const normLuckyName = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z\s]/g,'').trim();
const matchLuckyPlayer = (apiName, team) => {
  if (!apiName) return null;
  const apiTokens = new Set(normLuckyName(apiName).split(/\s+/).filter(Boolean));
  let best = null, bestScore = 0;
  for (const [name, t] of LUCKY_PLAYERS) {
    if (team && t !== team) continue;
    const overlap = normLuckyName(name).split(/\s+/).filter(tok => apiTokens.has(tok)).length;
    if (overlap > bestScore) { bestScore = overlap; best = name; }
  }
  return bestScore > 0 ? best : null;
};

const finalizeLuckyResult = async (supabase, AF_KEY, fixture) => {
  try {
    const fixtureId = fixture.fixture.id;
    const homeIsBrasil = fixture.teams.home.name === 'Brazil';
    const scoreA = homeIsBrasil ? fixture.goals.home : fixture.goals.away;
    const scoreB = homeIsBrasil ? fixture.goals.away : fixture.goals.home;
    const brasilTeamId = homeIsBrasil ? fixture.teams.home.id : fixture.teams.away.id;
    const norueganTeamId = homeIsBrasil ? fixture.teams.away.id : fixture.teams.home.id;

    // Eventos normalizados: { type, detail, teamKey: 'brasil'|'noruega', elapsed, playerName }
    let events = [];
    if (fixtureId && AF_KEY) {
      try {
        const evRes = await fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`, { headers: { 'x-apisports-key': AF_KEY } });
        if (evRes.ok) {
          events = ((await evRes.json()).response || []).map(e => ({
            type: e.type,
            detail: e.detail,
            teamKey: e.team.id === brasilTeamId ? 'brasil' : e.team.id === norueganTeamId ? 'noruega' : null,
            elapsed: e.time?.elapsed || 0,
            playerName: e.player?.name || null,
          }));
        }
      } catch { /* tenta ESPN abaixo */ }
    }
    // Fallback ESPN — a API-Football pode estar sem eventos (cota do plano free esgotada).
    if (events.length === 0) {
      events = await espnFindAndFetchLuckyEvents(fixture.fixture.date);
    }
    const eventsFound = events.length > 0;

    const goals = events.filter(e => e.type === 'Goal' && e.detail !== 'Missed Penalty');
    const firstGoal = goals[0];
    const firstTeam = firstGoal ? firstGoal.teamKey : null;
    const scorerNameRaw = firstGoal?.playerName || null;
    const scorerName = matchLuckyPlayer(scorerNameRaw, firstTeam) || scorerNameRaw;

    const hasPenalty = events.some(e => e.type === 'Goal' && (e.detail === 'Penalty' || e.detail === 'Missed Penalty'));
    const isRedLucky = e => e.type === 'Card' && (e.detail === 'Red Card' || e.detail === 'Yellow Red Card');
    const hasRedCard = events.some(isRedLucky);
    const hasYellowBrasil = events.some(e => e.type === 'Card' && e.detail === 'Yellow Card' && e.teamKey === 'brasil');
    const hasYellowNoruega = events.some(e => e.type === 'Card' && e.detail === 'Yellow Card' && e.teamKey === 'noruega');
    const yellowTeam = hasYellowBrasil && hasYellowNoruega ? 'ambos' : hasYellowBrasil ? 'brasil' : hasYellowNoruega ? 'noruega' : null;

    const firstHalfGoal = goals.some(e => e.elapsed <= 45);
    const secondHalfGoal = goals.some(e => e.elapsed > 45);
    const ownGoal = events.some(e => e.type === 'Goal' && e.detail === 'Own Goal');
    const bothScore = scoreA > 0 && scoreB > 0; // não depende dos eventos, vem direto do placar
    const status = fixture.fixture?.status?.short;
    const extraTime = status === 'AET' || status === 'PEN';
    const penaltyShootout = status === 'PEN';

    // Se não achamos os eventos em NENHUMA fonte, não grava "não aconteceu" pros
    // campos que dependem deles — só os que vêm direto do placar/status, pra não
    // marcar palpite certo como errado (mesmo bug que já corrigimos nos outros jogos).
    const upsertPayload = {
      id: 1,
      score_a: scoreA, score_b: scoreB,
      both_score: bothScore,
      extra_time: extraTime, penalty_shootout: penaltyShootout,
      is_finished: true, validated_at: new Date().toISOString(), validated_by: null,
    };
    if (eventsFound) {
      Object.assign(upsertPayload, {
        first_team: firstTeam,
        scorer_name: scorerName,
        penalty: hasPenalty, red_card: hasRedCard,
        yellow_card: hasYellowBrasil || hasYellowNoruega, yellow_team: yellowTeam,
        first_half_goal: firstHalfGoal, second_half_goal: secondHalfGoal,
        own_goal: ownGoal,
      });
    } else {
      console.warn('[sync-scores] Palpite da Sorte: eventos não encontrados em nenhuma fonte, gravando só o placar por agora.');
    }

    await supabase.from('lucky_result').upsert(upsertPayload);
    console.log(`[sync-scores] Palpite da Sorte apurado automaticamente: ${scoreA}×${scoreB}, 1º gol: ${firstTeam || '?'} (${scorerName || 'não identificado'})`);
  } catch (e) {
    console.error('[sync-scores] erro ao apurar Palpite da Sorte:', e.message);
  }
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
const ESPN_LEAGUES_FALLBACK = [
  'fifa.worldcup', 'intl-friendlies', 'concacaf.nations.league', 'uefa.nations', 'all',
];

const espnFindAndFetchEvents = async (matchDate, nameA, nameB) => {
  const date = matchDate.split('T')[0];
  const matchDateMs = new Date(matchDate).getTime();
  const minSinceKickoff = (Date.now() - matchDateMs) / 60000;
  // Checa data do jogo + 1 dia antes e depois (margem de fuso horário)
  const days = [0, -1, 1, -2].map(offset => {
    const d = new Date(matchDateMs + offset * 86400000);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  });
  for (const league of ESPN_LEAGUES_FALLBACK) {
    for (const ds of days) {
      try {
        const rs = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${ds}`);
        if (!rs.ok) continue;
        const data = await rs.json();
        for (const ev of (data.events || [])) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;
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
          const sum = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${ev.id}`);
          if (!sum.ok) return null;
          const sd = await sum.json();
          // Fonte principal: header.competitions[0].details (gols/cartões), que vem
          // preenchido mesmo quando "plays"/"keyPlays" estão vazios.
          const details = sd.header?.competitions?.[0]?.details || [];
          let events = [];
          if (details.length) {
            events = details.map(d => {
              const elapsed = Math.ceil((d.clock?.value || 0) / 60);
              const extra = d.addedClock?.value > 0 ? d.addedClock.value : null;
              const team = { id: d.team?.id || null };
              const time = { elapsed, extra };
              if (d.scoringPlay) return { type:'Goal', detail: d.ownGoal?'Own Goal':d.penaltyKick?'Penalty':'Normal Goal', team, time };
              if (d.redCard) return { type:'Card', detail: d.yellowCard?'Yellow Red Card':'Red Card', team, time };
              if (d.yellowCard) return { type:'Card', detail:'Yellow Card', team, time };
              return null;
            }).filter(Boolean);
          } else {
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
          }
          console.log(`[sync-scores] ESPN events para ${nameA} vs ${nameB}: ${events.length} (liga=${league})`);
          return { events, homeIsTeamA, homeTeamId, awayTeamId };
        }
      } catch(e) { console.warn('[sync-scores] ESPN events erro:', e.message); }
    }
  }
  return null;
};

// Acha o jogo Brasil x Noruega via ESPN (sem chave, sem cota) — usado como fallback
// quando a API-Football não retorna esse fixture na listagem (cota esgotada etc).
// Só devolve quando o jogo já terminou (FT/AET/PEN).
const espnFindLuckyFixture = async () => {
  const now = new Date();
  for (const league of ESPN_LEAGUES_FALLBACK) {
    for (const offset of [-2, -1, 0, 1]) {
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
          if (!names.includes('Brazil') || !names.includes('Norway')) continue;
          if (!comp.status?.type?.completed) continue;
          return {
            date: comp.date || ev.date,
            status: 'FT',
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

// Mesma busca acima, mas específica pro Palpite da Sorte: também extrai o nome
// do jogador (necessário pra comparar com o palpite de "quem marca primeiro"),
// que a espnFindAndFetchEvents genérica não guarda (não precisa pros outros jogos).
const espnFindAndFetchLuckyEvents = async (matchDate) => {
  const matchDateMs = new Date(matchDate).getTime();
  const days = [0, -1, 1, -2].map(offset => {
    const d = new Date(matchDateMs + offset * 86400000);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  });
  for (const league of ESPN_LEAGUES_FALLBACK) {
    for (const ds of days) {
      try {
        const rs = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${ds}`);
        if (!rs.ok) continue;
        const data = await rs.json();
        for (const ev of (data.events || [])) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;
          const homeC = comp.competitors?.find(c => c.homeAway === 'home');
          const awayC = comp.competitors?.find(c => c.homeAway === 'away');
          if (!homeC || !awayC) continue;
          const names = [homeC.team.displayName, awayC.team.displayName];
          if (!names.includes('Brazil') || !names.includes('Norway')) continue;
          const homeIsBrasil = homeC.team.displayName === 'Brazil';
          const homeTeamIdESPN = homeC.team.id;
          const sum = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${ev.id}`);
          if (!sum.ok) return [];
          const sd = await sum.json();
          const details = sd.header?.competitions?.[0]?.details || [];
          const events = details.map(d => {
            const isHome = d.team?.id === homeTeamIdESPN;
            const teamKey = (isHome === homeIsBrasil) ? 'brasil' : 'noruega';
            const elapsed = Math.ceil((d.clock?.value || 0) / 60);
            const playerName = d.athletesInvolved?.[0]?.displayName || d.participants?.[0]?.athlete?.displayName || null;
            if (d.scoringPlay) return { type:'Goal', detail: d.ownGoal?'Own Goal':d.penaltyKick?'Penalty':'Normal Goal', teamKey, elapsed, playerName };
            if (d.redCard) return { type:'Card', detail: d.yellowCard?'Yellow Red Card':'Red Card', teamKey, elapsed, playerName };
            if (d.yellowCard) return { type:'Card', detail:'Yellow Card', teamKey, elapsed, playerName };
            return null;
          }).filter(Boolean);
          console.log(`[sync-scores] ESPN events (Palpite da Sorte): ${events.length} (liga=${league})`);
          return events;
        }
      } catch(e) { console.warn('[sync-scores] ESPN events (Palpite da Sorte) erro:', e.message); }
    }
  }
  return [];
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
                       (resolveToDb(h)===match.team_a&&resolveToDb(a)===match.team_b)||
                       (resolveToDb(h)===match.team_b&&resolveToDb(a)===match.team_a);
              });
              if (fixture) {
                homeIsTeamA = fixture.teams.home.name === nameA || resolveToDb(fixture.teams.home.name) === match.team_a;
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

    const results = events.length > 0
      ? buildResults(events, status, homeIsTeamA, homeTeamId, awayTeamId, scoreA, scoreB)
      : buildScoreOnlyResults(scoreA, scoreB, status);
    if (events.length === 0) {
      console.log(`[sync-scores] extras: jogo ${match.id} encontrado mas sem eventos — validando só pelo placar (${Object.keys(results).length}/16)`);
    }
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

  const { data: matches } = await supabase.from('matches').select('*').eq('is_finished', false);

  // Palpite da Sorte — checa se já foi apurado antes de gastar qualquer ciclo com isso.
  const { data: luckyRow } = await supabase.from('lucky_result').select('is_finished').eq('id', 1).maybeSingle();
  const luckyPending = !luckyRow?.is_finished;
  let luckyFixtureFound = null;

  const now = Date.now();
  const activeMatches = (matches || []).filter(m => (now - new Date(m.match_date).getTime()) / 60000 >= -30);
  if (!activeMatches.length && !luckyPending) {
    return { statusCode: 200, body: JSON.stringify({ updated: 0, matches: [], body: 'Nenhum jogo pendente' }) };
  }

  const AF_KEY = process.env.API_FOOTBALL_KEY || process.env.REACT_APP_API_FOOTBALL_KEY;

  // API_TO_DB: English → Portuguese, com SAFE_OVERRIDES sobrescrevendo
  const API_TO_DB = Object.fromEntries(
    Object.entries(DB_TO_API).map(([db, en]) => [norm(en), norm(db)])
  );

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
    'Türkiye':           'Turquia',
    'Turkiye':                'Turquia',
    'Turkey':                 'Turquia',
    'Ecuador':                'Equador',
    'Paraguay':               'Paraguai',
    'Uruguay':                'Uruguai',
    'Colombia':               'Colômbia',
    'Venezuela':              'Venezuela',
    'Chile':                  'Chile',
    'Peru':                   'Peru',
    'Ghana':                  'Gana',
    'Egypt':                  'Egito',
    'Morocco':                'Marrocos',
    'Senegal':                'Senegal',
    'Iraq':                   'Iraque',
    'Qatar':                  'Catar',
  };
  // SAFE_OVERRIDES tem prioridade — usa Unicode escapes para evitar problema de encoding
  Object.assign(API_TO_DB, SAFE_OVERRIDES);

  const resolveTeam = name => {
    const n = norm(name);
    return API_TO_DB[n] || n;
  };
  const COMPLETED = new Set(['FT','AET','PEN']);
  const LIVE      = new Set(['1H','HT','2H','ET','BT','P','LIVE']);

  // Rastreia fixtures por match ID — cada etapa só processa jogos ainda não encontrados
  const fixtureByMatchId = new Map();

  const findActiveMatch = (homeName, awayName) => {
    const h = resolveTeam(homeName), a = resolveTeam(awayName);
    return activeMatches.find(m =>
      (norm(m.team_a)===h && norm(m.team_b)===a) ||
      (norm(m.team_a)===a && norm(m.team_b)===h)
    );
  };

  const registerFixture = (fixture, homeName, awayName) => {
    const m = findActiveMatch(homeName, awayName);
    if (m && !fixtureByMatchId.has(m.id)) {
      fixtureByMatchId.set(m.id, fixture);
      return true;
    }
    return false;
  };

  const unmatched = () => activeMatches.filter(m => !fixtureByMatchId.has(m.id));

  // ── Etapa 1: API-Football fixtures?live=all ──────────────────────────────────
  if (AF_KEY) try {
    const liveRes = await fetch(
      'https://v3.football.api-sports.io/fixtures?live=all',
      { headers: { 'x-apisports-key': AF_KEY } }
    );
    if (liveRes.ok) {
      for (const f of (await liveRes.json()).response || []) {
        registerFixture({ ...f, _afId: f.fixture.id }, f.teams.home.name, f.teams.away.name);
        if (luckyPending && !luckyFixtureFound && isLuckyFixture(f) && COMPLETED.has(f.fixture.status.short)) {
          luckyFixtureFound = f;
        }
      }
    }
    console.log(`[sync] Etapa 1 (AF live): ${fixtureByMatchId.size}/${activeMatches.length} jogos encontrados`);
  } catch(e) { console.warn('[sync] Etapa 1 erro:', e.message); }

  // ── Etapa 2: API-Football por data (jogos encerrados hoje/ontem) ─────────────
  if (AF_KEY && (unmatched().length || (luckyPending && !luckyFixtureFound))) {
    try {
      const today     = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const [r1, r2] = await Promise.all([
        fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`,     { headers: { 'x-apisports-key': AF_KEY } }),
        fetch(`https://v3.football.api-sports.io/fixtures?date=${yesterday}`, { headers: { 'x-apisports-key': AF_KEY } }),
      ]);
      const d1 = r1.ok ? (await r1.json()).response || [] : [];
      const d2 = r2.ok ? (await r2.json()).response || [] : [];
      const seen = new Set();
      for (const f of [...d1, ...d2]) {
        if (seen.has(f.fixture.id)) continue;
        seen.add(f.fixture.id);
        if (luckyPending && !luckyFixtureFound && isLuckyFixture(f) && COMPLETED.has(f.fixture.status.short)) {
          luckyFixtureFound = f;
        }
        if (!COMPLETED.has(f.fixture.status.short)) continue;
        registerFixture({ ...f, _afId: f.fixture.id }, f.teams.home.name, f.teams.away.name);
      }
      console.log(`[sync] Etapa 2 (AF data): ${fixtureByMatchId.size}/${activeMatches.length} jogos encontrados`);
    } catch(e) { console.warn('[sync] Etapa 2 erro:', e.message); }
  }

  // ── Apuração automática do Palpite da Sorte (Brasil x Noruega) ───────────────
  // Se a API-Football não achou o jogo (cota esgotada, fixture fora da janela do
  // plano free, etc), tenta achar via ESPN antes de desistir — senão o jogo nunca
  // chega a ser apurado automaticamente.
  if (!luckyFixtureFound && luckyPending) {
    try {
      const espnFixture = await espnFindLuckyFixture();
      if (espnFixture) {
        luckyFixtureFound = {
          fixture: { id: null, date: espnFixture.date, status: { short: espnFixture.status } },
          teams: {
            home: { name: espnFixture.homeIsBrasil ? 'Brazil' : 'Japan', id: null },
            away: { name: espnFixture.homeIsBrasil ? 'Japan' : 'Brazil', id: null },
          },
          goals: { home: espnFixture.scoreHome, away: espnFixture.scoreAway },
        };
        console.log('[sync] Palpite da Sorte: jogo achado via ESPN (fallback)');
      }
    } catch(e) { console.warn('[sync] Palpite da Sorte: erro no fallback ESPN pra achar o jogo:', e.message); }
  }

  if (luckyFixtureFound) {
    await finalizeLuckyResult(supabase, AF_KEY, luckyFixtureFound);
  }

  // ── Etapa 3: football-data.org (Copa encerrada, plano free) ─────────────────
  const FD_KEY = process.env.FOOTBALL_DATA_API_KEY || process.env.FOOTBALL_DATA_KEY || process.env.REACT_APP_FOOTBALL_API_KEY;
  if (unmatched().length && FD_KEY) {
    try {
      const fdRes = await fetch(
        'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
        { headers: { 'X-Auth-Token': FD_KEY } }
      );
      if (fdRes.ok) {
        for (const m of (await fdRes.json()).matches || []) {
          registerFixture({
            fixture: { id: m.id, status: { short: 'FT', elapsed: 90 } },
            teams:   { home: { name: m.homeTeam.name, id: m.homeTeam.id }, away: { name: m.awayTeam.name, id: m.awayTeam.id } },
            goals:   { home: m.score.fullTime.home, away: m.score.fullTime.away },
          }, m.homeTeam.name, m.awayTeam.name);
        }
        console.log(`[sync] Etapa 3 (FD.org): ${fixtureByMatchId.size}/${activeMatches.length} jogos encontrados`);
      }
    } catch(e) { console.error('[sync] Etapa 3 erro:', e.message); }
  }

  // ── Etapa 4: ESPN scoreboard — ao vivo E encerrado, múltiplas ligas e datas ──
  // Roda para jogos ainda não encontrados (ESPN cobre ao vivo também, não apenas FT)
  if (unmatched().length) {
    const fmt  = d => d.toISOString().split('T')[0].replace(/-/g, '');
    const days = [fmt(new Date()), fmt(new Date(Date.now()-86400000)), fmt(new Date(Date.now()-172800000)), fmt(new Date(Date.now()-259200000))];
    const espnLeagues = ['fifa.worldcup','intl-friendlies','concacaf.nations.league','uefa.nations','all'];
    const espnStatusMap = {
      STATUS_FIRST_HALF:'1H', STATUS_HALFTIME:'HT', STATUS_SECOND_HALF:'2H',
      STATUS_EXTRA_TIME:'ET', STATUS_FINAL:'FT', STATUS_FULL_TIME:'FT',
      STATUS_OVERTIME:'ET', STATUS_SHOOTOUT:'P',
    };
    try {
      outerESPN: for (const league of espnLeagues) {
        for (const ds of days) {
          if (!unmatched().length) break outerESPN;
          const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${ds}`);
          if (!r.ok) continue;
          const data = await r.json();
          for (const ev of (data.events || [])) {
            const comp = ev.competitions?.[0];
            if (!comp) continue;
            const st = comp.status?.type;
            const isLiveEspn      = st?.state === 'in';
            const isCompletedEspn = st?.completed === true;
            if (!isLiveEspn && !isCompletedEspn) continue;
            const homeC = comp.competitors?.find(c => c.homeAway==='home');
            const awayC = comp.competitors?.find(c => c.homeAway==='away');
            if (!homeC || !awayC) continue;
            const h    = homeC.team.displayName;
            const a    = awayC.team.displayName;
            const hAlt = ESPN_ABBR_TO_NAME[homeC.team.abbreviation] || h;
            const aAlt = ESPN_ABBR_TO_NAME[awayC.team.abbreviation] || a;
            // Tenta match pelo displayName ou pela abreviação traduzida
            const am = findActiveMatch(h, a) || findActiveMatch(hAlt, aAlt);
            if (!am || fixtureByMatchId.has(am.id)) continue;
            const period   = comp.status?.period || 1;
            const clockMin = parseInt(comp.status?.displayClock?.split(':')[0]) || 0;
            const espnSt   = isCompletedEspn ? 'FT' : (espnStatusMap[st?.name] || (period===1?'1H':'2H'));
            const elapsed  = isCompletedEspn ? 90 : (clockMin || (period===1?45:90));
            fixtureByMatchId.set(am.id, {
              fixture: { id: null, status: { short: espnSt, elapsed } },
              teams:   { home: { name: hAlt, id: homeC.team.id }, away: { name: aAlt, id: awayC.team.id } },
              goals:   { home: parseInt(homeC.score||0), away: parseInt(awayC.score||0) },
              _espnLeague: league,
            });
            console.log(`[sync] Etapa 4 (ESPN/${league}): ${am.team_a} vs ${am.team_b} status=${espnSt} ${parseInt(homeC.score||0)}×${parseInt(awayC.score||0)}`);
          }
        }
      }
    } catch(e) { console.error('[sync] Etapa 4 erro:', e.message); }
  }

  // ── Etapa 5: AF team/last10 (jogos > 90 min que ainda não foram encontrados) ──
  const lateUnmatched = unmatched().filter(m => (now - new Date(m.match_date).getTime())/60000 >= 90);
  for (const am of (AF_KEY ? lateUnmatched.slice(0, 4) : [])) {
    const nameA = DB_TO_API[am.team_a] || am.team_a;
    try {
      const tr = await fetch(
        `https://v3.football.api-sports.io/teams?name=${encodeURIComponent(nameA)}`,
        { headers: { 'x-apisports-key': AF_KEY } }
      );
      if (!tr.ok) continue;
      const teamId = (await tr.json()).response?.[0]?.team?.id;
      if (!teamId) continue;
      const fr = await fetch(
        `https://v3.football.api-sports.io/fixtures?team=${teamId}&last=10`,
        { headers: { 'x-apisports-key': AF_KEY } }
      );
      if (!fr.ok) continue;
      const matchDate = am.match_date.split('T')[0];
      const fx = (await fr.json()).response?.find(f => {
        if (!COMPLETED.has(f.fixture.status.short)) return false;
        const fxDate = f.fixture.date?.split('T')[0] || '';
        if (Math.abs((new Date(fxDate)-new Date(matchDate))/86400000) > 2) return false;
        const h = resolveTeam(f.teams.home.name), a = resolveTeam(f.teams.away.name);
        return (norm(am.team_a)===h&&norm(am.team_b)===a)||(norm(am.team_a)===a&&norm(am.team_b)===h);
      });
      if (fx) {
        fixtureByMatchId.set(am.id, { ...fx, _afId: fx.fixture.id });
        console.log(`[sync] Etapa 5 (AF team/last10): ${am.team_a} vs ${am.team_b} → fixture ${fx.fixture.id}`);
      }
    } catch(e) { console.warn('[sync] Etapa 5 erro:', e.message); }
  }

  const fixtures = [...fixtureByMatchId.values()];
  console.log(`[sync] Total encontrado: ${fixtures.length}/${activeMatches.length} jogos ativos`);

  if (!fixtures.length) {
    const pendingNames = activeMatches.map(m => `${m.team_a} × ${m.team_b}`).join(', ');
    return { statusCode: 200, body: JSON.stringify({ updated: 0, matches: [], body: `Nenhuma API retornou jogos. Pendentes: ${pendingNames}` }) };
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
