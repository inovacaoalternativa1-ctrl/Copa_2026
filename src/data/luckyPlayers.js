// ─────────────────────────────────────────────────────────────────────────
// ESCALAÇÃO PROVISÓRIA — lista de convocados, posição estimada no campinho.
// Fotos: Wikimedia Commons (verificadas uma a uma). Trocar pelos titulares
// confirmados antes de liberar pra valer.
// Compartilhado entre LuckyPredictionPage (exibição) e luckyAutoDetect
// (casar o nome do artilheiro vindo da API com o nome oficial daqui).
// ─────────────────────────────────────────────────────────────────────────
export const slug = (name) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-');

// Fotos reais verificadas (Wikimedia Commons). Quem não está aqui usa avatar de iniciais.
export const PHOTOS = {
  'Alisson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Alisson_Becker_Brazil_V_Morocco_13_June_2026-117_%28cropped%29.jpg/330px-Alisson_Becker_Brazil_V_Morocco_13_June_2026-117_%28cropped%29.jpg',
  'Danilo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Danilo_and_Bilal_El_Khannouss_at_2026_FIFA_World_Cup_by_YantsImages_%28cropped%29.jpg/330px-Danilo_and_Bilal_El_Khannouss_at_2026_FIFA_World_Cup_by_YantsImages_%28cropped%29.jpg',
  'Marquinhos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Marquinhos_Brazil_V_Morocco_13_June_2026-153_%28cropped%29.jpg/330px-Marquinhos_Brazil_V_Morocco_13_June_2026-153_%28cropped%29.jpg',
  'Bremer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Bremer_Brazil_V_Morocco_13_June_2026-143_%28cropped%29.jpg/330px-Bremer_Brazil_V_Morocco_13_June_2026-143_%28cropped%29.jpg',
  'Alex Sandro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Alex_Sandro_Brazil_V_Morocco_13_June_2026-137_%28cropped%29.jpg/330px-Alex_Sandro_Brazil_V_Morocco_13_June_2026-137_%28cropped%29.jpg',
  'Casemiro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Casemiro_Brazil_V_Morocco_13_June_2026-76_%28cropped%29.jpg/330px-Casemiro_Brazil_V_Morocco_13_June_2026-76_%28cropped%29.jpg',
  'Bruno Guimarães': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Bruno_Guimaraes_Brazil_V_Morocco_13_June_2026-78_%28cropped%29.jpg/330px-Bruno_Guimaraes_Brazil_V_Morocco_13_June_2026-78_%28cropped%29.jpg',
  'Lucas Paquetá': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Lucas_Paqueta_Brazil_V_Morocco_13_June_2026-134_%28cropped%29.jpg/330px-Lucas_Paqueta_Brazil_V_Morocco_13_June_2026-134_%28cropped%29.jpg',
  'Raphinha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Raphinha_Brazil_V_Morocco_13_June_2026-133_%28cropped%29.jpg/330px-Raphinha_Brazil_V_Morocco_13_June_2026-133_%28cropped%29.jpg',
  'Vinícius Júnior': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_%28cropped%29.jpg/330px-Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_%28cropped%29.jpg',
  'Neymar Júnior': '/players/neymar.jpg',
  'Ederson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Ederson_Brazil_V_Morocco_13_June_2026-14_%28cropped%29.jpg/330px-Ederson_Brazil_V_Morocco_13_June_2026-14_%28cropped%29.jpg',
  'Weverton': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Weverton_Brazil_V_Morocco_13_June_2026-67_%28cropped%29.jpg/330px-Weverton_Brazil_V_Morocco_13_June_2026-67_%28cropped%29.jpg',
  'Douglas Santos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Douglas_Santos_Brazil_V_Morocco_13_June_2026-87_%28cropped%29.jpg/330px-Douglas_Santos_Brazil_V_Morocco_13_June_2026-87_%28cropped%29.jpg',
  'Gabriel Magalhães': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Gabriel_Magalhaes_Brazil_V_Morocco_13_June_2026-132_%28cropped%29.jpg/330px-Gabriel_Magalhaes_Brazil_V_Morocco_13_June_2026-132_%28cropped%29.jpg',
  'Ibañez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Ibanez_Brazil_V_Morocco_13_June_2026-66.jpg/330px-Ibanez_Brazil_V_Morocco_13_June_2026-66.jpg',
  'Léo Pereira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Leo_Pereira_Brazil_V_Morocco_13_June_2026-136_%28cropped%29.jpg/330px-Leo_Pereira_Brazil_V_Morocco_13_June_2026-136_%28cropped%29.jpg',
  'Danilo Santos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Danilo_Sousa_Brazil_V_Morocco_13_June_2026-140_%28cropped%29.jpg/330px-Danilo_Sousa_Brazil_V_Morocco_13_June_2026-140_%28cropped%29.jpg',
  'Fabinho': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Fabinho_Brazil_V_Morocco_13_June_2026-70.jpg/330px-Fabinho_Brazil_V_Morocco_13_June_2026-70.jpg',
  'Endrick': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Team_Brazil_at_2026_FIFA_World_Cup_by_YantsImages_%28Endrick%29.jpg/330px-Team_Brazil_at_2026_FIFA_World_Cup_by_YantsImages_%28Endrick%29.jpg',
  'Gabriel Martinelli': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Gabriel_Martinelli_Brazil_V_Morocco_13_June_2026-144.jpg/330px-Gabriel_Martinelli_Brazil_V_Morocco_13_June_2026-144.jpg',
  'Luiz Henrique': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Luiz_Henrique_Brazil_V_Morocco_13_June_2026-147.jpg/330px-Luiz_Henrique_Brazil_V_Morocco_13_June_2026-147.jpg',
  'Matheus Cunha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Matheus_Cunha_Brazil_V_Morocco_13_June_2026-178_%28cropped%29.jpg/330px-Matheus_Cunha_Brazil_V_Morocco_13_June_2026-178_%28cropped%29.jpg',
  'Igor Thiago': '/players/igor-thiago.jpg',
  'Éderson': '/players/ederson-atalanta.jpg',
  'Rayan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Rayan_Brazil_V_Morocco_13_June_2026-142.jpg/330px-Rayan_Brazil_V_Morocco_13_June_2026-142.jpg',
  'Angus Gunn': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Angus_Gunn_Scotland_v_Bolivia_6_June_2026-42.jpg/330px-Angus_Gunn_Scotland_v_Bolivia_6_June_2026-42.jpg',
  'Nathan Patterson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Nathan_Patterson_Scotland_v_Bolivia_6_June_2026-58.jpg/330px-Nathan_Patterson_Scotland_v_Bolivia_6_June_2026-58.jpg',
  'Grant Hanley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Grant_Hanley_Scotland_v_Bolivia_6_June_2026-39_%28cropped%29.jpg/330px-Grant_Hanley_Scotland_v_Bolivia_6_June_2026-39_%28cropped%29.jpg',
  'Jack Hendry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Jack_Hendry_Scotland_v_Bolivia_6_June_2026-35.jpg/330px-Jack_Hendry_Scotland_v_Bolivia_6_June_2026-35.jpg',
  'Andy Robertson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Andy_Robertson_Scotland_v_Bolivia_6_June_2026-43.jpg/330px-Andy_Robertson_Scotland_v_Bolivia_6_June_2026-43.jpg',
  'Scott McTominay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Scott_McTominay_Scotland_v_Bolivia_6_June_2026-41.jpg/330px-Scott_McTominay_Scotland_v_Bolivia_6_June_2026-41.jpg',
  'John McGinn': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/John_McGinn_Scotland_v_Bolivia_6_June_2026-2.jpg/330px-John_McGinn_Scotland_v_Bolivia_6_June_2026-2.jpg',
  'Kenny McLean': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Kenny_McLean_Scotland_v_Bolivia_6_June_2026-177_%28cropped%29.jpg/330px-Kenny_McLean_Scotland_v_Bolivia_6_June_2026-177_%28cropped%29.jpg',
  'Ché Adams': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Che_Adams_Scotland_v_Bolivia_6_June_2026-37_%28cropped%29.jpg/330px-Che_Adams_Scotland_v_Bolivia_6_June_2026-37_%28cropped%29.jpg',
  'Ryan Christie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Ryan_Christie_Bournemouth_%28cropped%29.png/330px-Ryan_Christie_Bournemouth_%28cropped%29.png',
  'Lawrence Shankland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Lawrence_Shankland_Scotland_v_Bolivia_6_June_2026-66.jpg/330px-Lawrence_Shankland_Scotland_v_Bolivia_6_June_2026-66.jpg',
  'Craig Gordon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Craig_Gordon_Scotland_v_Bolivia_6_June_2026-19.jpg/330px-Craig_Gordon_Scotland_v_Bolivia_6_June_2026-19.jpg',
  'Liam Kelly': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Liam_Kelly_Scotland_v_Bolivia_6_June_2026-20.jpg/330px-Liam_Kelly_Scotland_v_Bolivia_6_June_2026-20.jpg',
  'Aaron Hickey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Aaron_Hickey_Scotland_v_Bolivia_6_June_2026-87_%28cropped%29.jpg/330px-Aaron_Hickey_Scotland_v_Bolivia_6_June_2026-87_%28cropped%29.jpg',
  'Anthony Ralston': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Anthony_Ralston_Scotland_v_Bolivia_6_June_2026-9_%28cropped%29.jpg/330px-Anthony_Ralston_Scotland_v_Bolivia_6_June_2026-9_%28cropped%29.jpg',
  'Dominic Hyam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Dominic_Hyam_Scotland_v_Bolivia_6_June_2026-59.jpg/330px-Dominic_Hyam_Scotland_v_Bolivia_6_June_2026-59.jpg',
  'John Souttar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/John_Souttar_Scotland_v_Bolivia_6_June_2026-163.jpg/330px-John_Souttar_Scotland_v_Bolivia_6_June_2026-163.jpg',
  'Kieran Tierney': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Kieran_Tierney_Scotland_v_Bolivia_6_June_2026-6.jpg/330px-Kieran_Tierney_Scotland_v_Bolivia_6_June_2026-6.jpg',
  'Scott McKenna': 'https://upload.wikimedia.org/wikipedia/commons/6/69/First_Minister_meets_with_Scottish_National_Football_Team_-_55168603663_%28Scott_McKenna_cropped%29.jpg',
  'Ben Gannon-Doak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Ben_Gannon-Doak_Scotland_v_Bolivia_6_June_2026-68_%28cropped%29.jpg/330px-Ben_Gannon-Doak_Scotland_v_Bolivia_6_June_2026-68_%28cropped%29.jpg',
  'Lewis Ferguson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Lewis_Ferguson_Scotland_v_Bolivia_6_June_2026-52.jpg/330px-Lewis_Ferguson_Scotland_v_Bolivia_6_June_2026-52.jpg',
  'Tyler Fletcher': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Tyler_Fletcher_Scotland_v_Bolivia_6_June_2026-4.jpg/330px-Tyler_Fletcher_Scotland_v_Bolivia_6_June_2026-4.jpg',
  'Findlay Curtis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Findlay_Curtis_Scotland_v_Bolivia_6_June_2026-56.jpg/330px-Findlay_Curtis_Scotland_v_Bolivia_6_June_2026-56.jpg',
  'George Hirst': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/George_Hirst_Scotland_v_Bolivia_6_June_2026-7.jpg/330px-George_Hirst_Scotland_v_Bolivia_6_June_2026-7.jpg',
  'Lyndon Dykes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Lyndon_Dykes_Scotland_v_Bolivia_6_June_2026-65.jpg/330px-Lyndon_Dykes_Scotland_v_Bolivia_6_June_2026-65.jpg',
  'Ross Stewart': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ross_Stewart_Scotland_v_Bolivia_6_June_2026-8.jpg/330px-Ross_Stewart_Scotland_v_Bolivia_6_June_2026-8.jpg',
};

// Todos os 26 convocados de cada seleção, agrupados por posição.
// "starter" marca quem entra no time titular estimado (anel dourado no campinho) —
// mas todos são clicáveis igualmente para o palpite de "quem marca primeiro".
export const POSITION_LABELS = { GK: 'Goleiros', DEF: 'Defensores', MID: 'Meio-campistas', FWD: 'Atacantes' };

const BRASIL_GROUPS = {
  GK:  [['Alisson', true], ['Ederson', false], ['Weverton', false]],
  DEF: [['Alex Sandro', true], ['Bremer', true], ['Danilo', true], ['Marquinhos', true], ['Douglas Santos', false], ['Gabriel Magalhães', false], ['Ibañez', false], ['Léo Pereira', false]],
  MID: [['Bruno Guimarães', true], ['Casemiro', true], ['Lucas Paquetá', true], ['Danilo Santos', false], ['Éderson', false], ['Fabinho', false]],
  FWD: [['Neymar Júnior', true], ['Raphinha', true], ['Vinícius Júnior', true], ['Endrick', false], ['Gabriel Martinelli', false], ['Igor Thiago', false], ['Luiz Henrique', false], ['Matheus Cunha', false], ['Rayan', false]],
};

const ESCOCIA_GROUPS = {
  GK:  [['Angus Gunn', true], ['Craig Gordon', false], ['Liam Kelly', false]],
  DEF: [['Andy Robertson', true], ['Grant Hanley', true], ['Jack Hendry', true], ['Nathan Patterson', true], ['Aaron Hickey', false], ['Anthony Ralston', false], ['Dominic Hyam', false], ['John Souttar', false], ['Kieran Tierney', false], ['Scott McKenna', false]],
  MID: [['John McGinn', true], ['Kenny McLean', true], ['Scott McTominay', true], ['Ben Gannon-Doak', false], ['Lewis Ferguson', false], ['Ryan Christie', false], ['Tyler Fletcher', false]],
  FWD: [['Ché Adams', true], ['Lawrence Shankland', true], ['Ross Stewart', true], ['Findlay Curtis', false], ['George Hirst', false], ['Lyndon Dykes', false]],
};

const buildTeamGroups = (team, groups) => {
  const out = {};
  for (const pos of ['GK', 'DEF', 'MID', 'FWD']) {
    out[pos] = groups[pos].map(([name, starter]) => ({
      name, pos, starter, team, id: `${team}-${slug(name)}`, photo: PHOTOS[name],
    }));
  }
  return out;
};

export const TEAM_BRASIL = buildTeamGroups('brasil', BRASIL_GROUPS);
export const TEAM_ESCOCIA = buildTeamGroups('escocia', ESCOCIA_GROUPS);

// Lista plana — usada pelo luckyAutoDetect pra casar o nome do artilheiro vindo da API.
export const ALL_PLAYERS = [
  ...['GK', 'DEF', 'MID', 'FWD'].flatMap(pos => TEAM_BRASIL[pos]),
  ...['GK', 'DEF', 'MID', 'FWD'].flatMap(pos => TEAM_ESCOCIA[pos]),
];
