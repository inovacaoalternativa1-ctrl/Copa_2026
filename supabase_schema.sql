-- ============================================================================
-- SCHEMA COMPLETO: Copa Simulada 2026 - Alternativa Serviços
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PERFIS DE USUÁRIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    whatsapp TEXT,
    cpf TEXT,
    city TEXT,
    state TEXT,
    instagram TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    accepted_terms BOOLEAN DEFAULT FALSE,
    total_points DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SELEÇÕES / TIMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    flag TEXT,
    group_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JOGOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.matches (
    id SERIAL PRIMARY KEY,
    team_a_id INT REFERENCES teams(id),
    team_b_id INT REFERENCES teams(id),
    team_a TEXT NOT NULL,
    team_b TEXT NOT NULL,
    team_a_flag TEXT,
    team_b_flag TEXT,
    match_date TIMESTAMPTZ NOT NULL,
    phase TEXT DEFAULT 'groups' CHECK (phase IN ('groups', 'round_of_16', 'quarterfinals', 'semifinals', 'final')),
    group_name TEXT,
    venue TEXT,
    score_a INT,
    score_b INT,
    is_finished BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    lock_minutes_before INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PALPITES DE PLACAR
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.score_predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_id INT NOT NULL REFERENCES matches(id),
    predicted_score_a INT NOT NULL,
    predicted_score_b INT NOT NULL,
    points_earned DECIMAL(5,2) DEFAULT 0,
    is_calculated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

-- ============================================================================
-- TIPOS DE PALPITES EXTRAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.extra_prediction_types (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    response_type TEXT NOT NULL CHECK (response_type IN ('yes_no', 'team_selection', 'multiple_choice', 'numeric')),
    base_points DECIMAL(5,2) NOT NULL DEFAULT 0.01,
    applicable_in_groups BOOLEAN DEFAULT TRUE,
    applicable_in_knockout BOOLEAN DEFAULT TRUE,
    applicable_in_final BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PALPITES EXTRAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.extra_predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_id INT NOT NULL REFERENCES matches(id),
    extra_type_id INT NOT NULL REFERENCES extra_prediction_types(id),
    predicted_answer JSONB NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id, extra_type_id)
);

-- ============================================================================
-- RESULTADOS EXTRAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.extra_results (
    id SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES matches(id),
    extra_type_id INT NOT NULL REFERENCES extra_prediction_types(id),
    official_result JSONB NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMPTZ,
    validated_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, extra_type_id)
);

-- ============================================================================
-- RESUMO DE PONTUAÇÃO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_scores (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    total_points DECIMAL(8,2) DEFAULT 0,
    score_points DECIMAL(8,2) DEFAULT 0,
    extra_points DECIMAL(8,2) DEFAULT 0,
    exact_scores INT DEFAULT 0,
    correct_winners INT DEFAULT 0,
    correct_extras INT DEFAULT 0,
    total_predictions INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CHAT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PATROCINADORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sponsors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    banner_url TEXT,
    position TEXT DEFAULT 'sidebar' CHECK (position IN ('header', 'sidebar', 'footer', 'popup')),
    is_active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SORTEIOS / PROMOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.promotions (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    prize TEXT,
    rules TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_score_pred_user ON score_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_score_pred_match ON score_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_extra_pred_user ON extra_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_extra_pred_match ON extra_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_scores_total ON user_scores(total_points DESC);

-- ============================================================================
-- VIEW: RANKING COMPLETO
-- ============================================================================
CREATE OR REPLACE VIEW public.ranking AS
SELECT
    p.id,
    p.username,
    p.full_name,
    p.city,
    p.state,
    p.instagram,
    COALESCE(us.total_points, 0) AS total_points,
    COALESCE(us.score_points, 0) AS score_points,
    COALESCE(us.extra_points, 0) AS extra_points,
    COALESCE(us.exact_scores, 0) AS exact_scores,
    COALESCE(us.correct_winners, 0) AS correct_winners,
    COALESCE(us.correct_extras, 0) AS correct_extras,
    COALESCE(us.total_predictions, 0) AS total_predictions,
    ROW_NUMBER() OVER (ORDER BY COALESCE(us.total_points,0) DESC, COALESCE(us.exact_scores,0) DESC, COALESCE(us.correct_winners,0) DESC, p.created_at ASC) AS position
FROM profiles p
LEFT JOIN user_scores us ON p.id = us.user_id
WHERE p.is_active = TRUE AND p.role = 'user'
ORDER BY total_points DESC;

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "score_pred_select" ON score_predictions FOR SELECT USING (true);
CREATE POLICY "score_pred_insert" ON score_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "score_pred_update" ON score_predictions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "extra_pred_select" ON extra_predictions FOR SELECT USING (true);
CREATE POLICY "extra_pred_insert" ON extra_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "extra_pred_update" ON extra_predictions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_scores_select" ON user_scores FOR SELECT USING (true);

CREATE POLICY "chat_select" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- DADOS INICIAIS: TIPOS DE PALPITES EXTRAS
-- ============================================================================
INSERT INTO extra_prediction_types (code, name, description, response_type, base_points)
VALUES
('goal_first_half','Gol no 1º Tempo','Haverá gol no primeiro tempo?','yes_no',0.01),
('goal_second_half','Gol no 2º Tempo','Haverá gol no segundo tempo?','yes_no',0.01),
('first_to_score','Primeiro a Marcar','Qual time fará o primeiro gol?','team_selection',0.03),
('team_a_first_half','Time A no 1º Tempo','Time A marcará no primeiro tempo?','yes_no',0.02),
('team_b_first_half','Time B no 1º Tempo','Time B marcará no primeiro tempo?','yes_no',0.02),
('yellow_team_a','Amarelo - Time A','Time A receberá cartão amarelo?','yes_no',0.01),
('yellow_team_b','Amarelo - Time B','Time B receberá cartão amarelo?','yes_no',0.01),
('red_card','Cartão Vermelho','Haverá cartão vermelho?','yes_no',0.02),
('red_team_a','Vermelho - Time A','Time A receberá vermelho?','yes_no',0.03),
('red_team_b','Vermelho - Time B','Time B receberá vermelho?','yes_no',0.03),
('penalty','Pênalti no Jogo','Haverá pênalti?','yes_no',0.03),
('header_goal','Gol de Cabeça','Haverá gol de cabeça?','yes_no',0.02),
('freekick_goal','Gol de Falta','Haverá gol de falta direta?','yes_no',0.03),
('own_goal','Gol Contra','Haverá gol contra?','yes_no',0.03),
('extra_time','Prorrogação','Haverá prorrogação? (mata-mata)','yes_no',0.05),
('penalties','Pênaltis','Haverá disputa de pênaltis? (mata-mata)','yes_no',0.05)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- DADOS INICIAIS: TIMES DA COPA 2026
-- ============================================================================
INSERT INTO teams (name, flag, group_name) VALUES
('Brasil','🇧🇷','A'),('Argentina','🇦🇷','B'),('França','🇫🇷','C'),
('Alemanha','🇩🇪','D'),('Inglaterra','🏴󠁧󠁢󠁥󠁮󠁧󠁿','E'),('Espanha','🇪🇸','F'),
('Portugal','🇵🇹','G'),('Itália','🇮🇹','H'),('Holanda','🇳🇱','A'),
('Bélgica','🇧🇪','B'),('Croácia','🇭🇷','C'),('Uruguai','🇺🇾','D'),
('México','🇲🇽','E'),('EUA','🇺🇸','F'),('Japão','🇯🇵','G'),
('Marrocos','🇲🇦','H')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- JOGOS DE EXEMPLO
-- ============================================================================
INSERT INTO matches (team_a, team_b, team_a_flag, team_b_flag, match_date, phase, group_name, venue)
VALUES
('Brasil','México','🇧🇷','🇲🇽', NOW() + INTERVAL '2 days','groups','A','MetLife Stadium - NJ'),
('Argentina','Chile','🇦🇷','🇨🇱', NOW() + INTERVAL '2 days','groups','B','AT&T Stadium - Texas'),
('França','Alemanha','🇫🇷','🇩🇪', NOW() + INTERVAL '3 days','groups','C','SoFi Stadium - LA'),
('Portugal','Espanha','🇵🇹','🇪🇸', NOW() + INTERVAL '3 days','groups','D','Levi''s Stadium - SF'),
('Inglaterra','Itália','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇮🇹', NOW() + INTERVAL '4 days','groups','E','Gillette Stadium - Boston'),
('Holanda','Bélgica','🇳🇱','🇧🇪', NOW() + INTERVAL '4 days','groups','F','Arrowhead Stadium - KC'),
('Japão','Marrocos','🇯🇵','🇲🇦', NOW() + INTERVAL '5 days','groups','G','Estadio Azteca - México'),
('EUA','Uruguai','🇺🇸','🇺🇾', NOW() + INTERVAL '5 days','groups','H','BC Place - Vancouver')
ON CONFLICT DO NOTHING;
