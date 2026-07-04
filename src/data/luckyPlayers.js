// ─────────────────────────────────────────────────────────────────────────
// ESCALAÇÃO PROVISÓRIA — lista de convocados, posição estimada no campinho.
// Fotos: Wikimedia Commons (verificadas uma a uma). Quem não tem foto
// verificada usa avatar de iniciais.
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
  'Danilo Santos': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Danilo_Santos_Brazil_V_Morocco_13_June_2026-140_%28cropped%29.jpg',
  'Fabinho': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Fabinho_Brazil_V_Morocco_13_June_2026-70.jpg/330px-Fabinho_Brazil_V_Morocco_13_June_2026-70.jpg',
  'Endrick': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Team_Brazil_at_2026_FIFA_World_Cup_by_YantsImages_%28Endrick%29.jpg/330px-Team_Brazil_at_2026_FIFA_World_Cup_by_YantsImages_%28Endrick%29.jpg',
  'Gabriel Martinelli': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Gabriel_Martinelli_Brazil_V_Morocco_13_June_2026-144.jpg/330px-Gabriel_Martinelli_Brazil_V_Morocco_13_June_2026-144.jpg',
  'Luiz Henrique': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Luiz_Henrique_Brazil_V_Morocco_13_June_2026-147.jpg/330px-Luiz_Henrique_Brazil_V_Morocco_13_June_2026-147.jpg',
  'Matheus Cunha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Matheus_Cunha_Brazil_V_Morocco_13_June_2026-178_%28cropped%29.jpg/330px-Matheus_Cunha_Brazil_V_Morocco_13_June_2026-178_%28cropped%29.jpg',
  'Igor Thiago': '/players/igor-thiago.jpg',
  'Éderson': '/players/ederson-atalanta.jpg',
  'Rayan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Rayan_Brazil_V_Morocco_13_June_2026-142.jpg/330px-Rayan_Brazil_V_Morocco_13_June_2026-142.jpg',
  'Ørjan Nyland': 'https://upload.wikimedia.org/wikipedia/commons/2/22/Norway_Italy_-_June_2025_A_10_%28cropped%29.jpg',
  'Martin Ødegaard': 'https://upload.wikimedia.org/wikipedia/commons/3/36/Martin_Odegaard_Morocco_v_Norway_7_June_2026-56_%28cropped%29.jpg',
  'Alexander Sørloth': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Alexander_Sorloth_Morocco_v_Norway_7_June_2026-58_%28cropped%29.jpg',
  'Erling Haaland': 'https://upload.wikimedia.org/wikipedia/commons/4/43/Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg',
  'Julian Ryerson': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Julian_Ryerson_Morocco_v_Norway_7_June_2026-200_%28cropped%29.jpg',
  'Antonio Nusa': 'https://upload.wikimedia.org/wikipedia/commons/8/80/Antonio_Nusa_Morocco_v_Norway_7_June_2026-110_%28cropped%29.jpg',
  'Fredrik Aursnes': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Fredrik_Aursnes_Morocco_v_Norway_7_June_2026-31.jpg',
  'Jens Petter Hauge': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Jens_Petter_Hauge_Morocco_v_Norway_7_June_2026-21.jpg',
  'Sander Berge': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Sander_Berge_01112025_%282%29.jpg',
  'Kristoffer Ajer': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Kristoffer_Ajer_02082025_%281%29.jpg',
  'Oscar Bobb': 'https://upload.wikimedia.org/wikipedia/commons/5/54/ManCity20240722-050_%28Oscar_Bobb2%29.jpg',
  'Jørgen Strand Larsen': 'https://upload.wikimedia.org/wikipedia/commons/4/45/J%C3%B8rgen_Strand_Larsen_01112025_%282%29.jpg',
  'Morten Thorsby': 'https://upload.wikimedia.org/wikipedia/commons/7/76/Norway_Italy_-_June_2025_B_01_%28cropped%29.jpg',
  'Marcus Holmgren Pedersen': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Marcus_Holmgren_Pedersen_2022_FC_RB_Salzburg_gegen_Feyenoord_Rotterdam_%28cropped%29.jpg',
  'Leo Østigard': 'https://img.a.transfermarkt.technology/portrait/big/367284-1708552959.jpg?lm=1',
  'Sander Tangvik': 'https://img.a.transfermarkt.technology/portrait/big/549378-1768895607.jpg?lm=1',
  'Egil Selvik': 'https://img.a.transfermarkt.technology/portrait/big/380744-1779430706.jpg?lm=1',
  'Fredrik André Bjørkan': 'https://img.a.transfermarkt.technology/portrait/big/364938-1771971421.jpg?lm=1',
  'Torbjørn Heggem': 'https://img.a.transfermarkt.technology/portrait/big/464469-1702050091.jpg?lm=1',
  'Sondre Langas': 'https://img.a.transfermarkt.technology/portrait/big/737837-1711131237.jpg?lm=1',
  'Kristian Thorstvedt': 'https://img.a.transfermarkt.technology/portrait/big/564785-1692883043.jpg?lm=1',
  'Thelo Aasgaard': 'https://img.a.transfermarkt.technology/portrait/big/647384-1645614893.png?lm=1',
  'Patrick Berg': 'https://img.a.transfermarkt.technology/portrait/big/308439-1712614235.jpg?lm=1',
  'Andreas Schjelderup': 'https://img.a.transfermarkt.technology/portrait/big/670103-1697191976.jpg?lm=1',
  'Henrik Falchener': 'https://img.a.transfermarkt.technology/portrait/big/743088-1780049035.jpg?lm=1',
  'David Møller Wolfe': 'https://img.a.transfermarkt.technology/portrait/big/661427-1753350331.jpg?lm=1',
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

const NORUEGA_GROUPS = {
  GK:  [['Ørjan Nyland', true], ['Sander Tangvik', false], ['Egil Selvik', false]],
  DEF: [['Julian Ryerson', true], ['Leo Østigard', true], ['Kristoffer Ajer', true], ['Fredrik André Bjørkan', true], ['Marcus Holmgren Pedersen', false], ['Torbjørn Heggem', false], ['Sondre Langas', false], ['Henrik Falchener', false], ['David Møller Wolfe', false]],
  MID: [['Martin Ødegaard', true], ['Sander Berge', true], ['Morten Thorsby', true], ['Fredrik Aursnes', false], ['Kristian Thorstvedt', false], ['Thelo Aasgaard', false], ['Oscar Bobb', false], ['Jens Petter Hauge', false], ['Patrick Berg', false]],
  FWD: [['Erling Haaland', true], ['Alexander Sørloth', true], ['Antonio Nusa', true], ['Jørgen Strand Larsen', false], ['Andreas Schjelderup', false]],
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
export const TEAM_NORUEGA = buildTeamGroups('noruega', NORUEGA_GROUPS);

// Lista plana — usada pelo luckyAutoDetect pra casar o nome do artilheiro vindo da API.
export const ALL_PLAYERS = [
  ...['GK', 'DEF', 'MID', 'FWD'].flatMap(pos => TEAM_BRASIL[pos]),
  ...['GK', 'DEF', 'MID', 'FWD'].flatMap(pos => TEAM_NORUEGA[pos]),
];
