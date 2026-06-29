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
  'Zion Suzuki': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/ZION_SUZUKI_-_JPN_vs_THA_-_Friendly_Match_-_2024.01.01.jpg',
  'Takefusa Kubo': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Takefusa_Kubo_1053.jpg',
  'Wataru Endo': 'https://upload.wikimedia.org/wikipedia/commons/3/36/Wataru_End%C5%8D_06042025_%281%29.jpg',
  'Ko Itakura': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Ko_Itakura_%28cropped%29.jpg',
  'Takehiro Tomiyasu': 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Takehiro_Tomiyasu.jpg',
  'Ritsu Doan': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Ritsu_D%C5%8Dan_2024_%28cropped%29.jpg',
  'Daichi Kamada': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/2022128173756_2022-05-08_Fussball_Eintracht_Frankfurt_vs_Borussia_M%C3%B6nchengladbach_-_Sven_-_1D_X_MK_II_-_0725_-_AK8I7460_%28Daichi_Kamada_cropped%29.jpg',
  'Yuto Nagatomo': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Yuto_Nagatomo_in_2018.jpg',
  'Junya Ito': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Ito_asse_sr_2425.png',
  'Ayase Ueda': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/AyaseUedaFrontPriorMatchCercleVsOHV_%28cropped%29.jpg',
  'Ao Tanaka': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Ao_Tanaka_13092025_%281%29_%28cropped%29.jpg',
  'Daizen Maeda': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Daizen_Maeda_%28cropped%29.jpg',
  'Yukinari Sugawara': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Yukinari_Sugawara_2212024_%285%29.jpg',
  'Koki Ogawa': 'https://upload.wikimedia.org/wikipedia/commons/4/47/GAE_-_NEC_-_53493888105_%28Koki_Ogawa%29.jpg',
  'Hiroki Ito': 'https://upload.wikimedia.org/wikipedia/commons/9/93/Hiroki_Ito_VfB_Stuttgart.jpg',
  'Shogo Taniguchi': 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Shogo_Taniguchi.jpg',
  'Yuito Suzuki': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Yuito_Suzuki.jpg',
  'Ayumu Seko': 'https://upload.wikimedia.org/wikipedia/commons/5/57/Ayumu_Seko_Japan_2025_%28cropped%29.jpg',
  'Keisuke Osako': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Sanfrecce_Hiroshima_-1_Keisuke_OSAKO.jpg',
  'Kaishu Sano': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Kaishu_Sano_2024_%28cropped%29.jpg',
  'Keito Nakamura': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Nakamura_asse_sr_2425.png',
  'Tomoki Hayakawa': 'https://jleague-co.s3.ap-northeast-1.amazonaws.com/jleague-co/images/1632225_HAYAKAWA_Tomoki_avatar_player_aLIf9hu.original.jpg',
  'Kento Shiogai': 'https://assets.bundesliga.com/player/dfl-obj-j0258e-dfl-clu-000003-dfl-sea-0001k9-body.png?crop=10,0,75,80&fit=256,256',
  'Junnosuke Suzuki': 'https://img.a.transfermarkt.technology/portrait/big/848856-1761081129.jpg?lm=1',
  'Tsuyoshi Watanabe': 'https://img.a.transfermarkt.technology/portrait/big/598791-1705504081.jpg?lm=1',
  'Keisuke Goto': 'https://img.a.transfermarkt.technology/portrait/big/916623-1737967086.jpg?lm=1',
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

const JAPAO_GROUPS = {
  GK:  [['Zion Suzuki', true], ['Keisuke Osako', false], ['Tomoki Hayakawa', false]],
  DEF: [['Yukinari Sugawara', true], ['Ko Itakura', true], ['Takehiro Tomiyasu', true], ['Yuto Nagatomo', true], ['Hiroki Ito', false], ['Junnosuke Suzuki', false], ['Ayumu Seko', false], ['Shogo Taniguchi', false], ['Tsuyoshi Watanabe', false]],
  MID: [['Wataru Endo', true], ['Ao Tanaka', true], ['Daichi Kamada', true], ['Ritsu Doan', true], ['Junya Ito', false], ['Daizen Maeda', false], ['Yuito Suzuki', false], ['Kaishu Sano', false], ['Keito Nakamura', false]],
  FWD: [['Takefusa Kubo', true], ['Ayase Ueda', true], ['Koki Ogawa', false], ['Kento Shiogai', false], ['Keisuke Goto', false]],
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
export const TEAM_JAPAO = buildTeamGroups('japao', JAPAO_GROUPS);

// Lista plana — usada pelo luckyAutoDetect pra casar o nome do artilheiro vindo da API.
export const ALL_PLAYERS = [
  ...['GK', 'DEF', 'MID', 'FWD'].flatMap(pos => TEAM_BRASIL[pos]),
  ...['GK', 'DEF', 'MID', 'FWD'].flatMap(pos => TEAM_JAPAO[pos]),
];
