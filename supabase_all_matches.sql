-- ============================================================
-- Copa do Mundo 2026 - UPSERT completo de todos os 72 jogos
-- Atualiza existentes + insere os que faltam
-- Execute no Supabase: SQL Editor → New query → Run
-- ============================================================

-- ============================================================
-- GRUPO A: México, Coreia do Sul, Tchéquia, África do Sul
-- ============================================================
UPDATE matches SET match_date='2026-06-11T19:00:00+00:00', venue='Estadio Azteca - Cidade do México',      phase='groups', group_name='A', round_number=1 WHERE (team_a='México' AND team_b='África do Sul') OR (team_a='África do Sul' AND team_b='México');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'México','África do Sul','🇲🇽','🇿🇦','2026-06-11T19:00:00+00:00','groups','A','Estadio Azteca - Cidade do México',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='México' AND team_b='África do Sul') OR (team_a='África do Sul' AND team_b='México'));

UPDATE matches SET match_date='2026-06-12T02:00:00+00:00', venue='Estadio Akron - Guadalajara',            phase='groups', group_name='A', round_number=1 WHERE (team_a='Coreia do Sul' AND team_b='Tchéquia') OR (team_a='Tchéquia' AND team_b='Coreia do Sul');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Coreia do Sul','Tchéquia','🇰🇷','🇨🇿','2026-06-12T02:00:00+00:00','groups','A','Estadio Akron - Guadalajara',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Coreia do Sul' AND team_b='Tchéquia') OR (team_a='Tchéquia' AND team_b='Coreia do Sul'));

UPDATE matches SET match_date='2026-06-18T16:00:00+00:00', venue='Mercedes-Benz Stadium - Atlanta',        phase='groups', group_name='A', round_number=2 WHERE (team_a='Tchéquia' AND team_b='África do Sul') OR (team_a='África do Sul' AND team_b='Tchéquia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Tchéquia','África do Sul','🇨🇿','🇿🇦','2026-06-18T16:00:00+00:00','groups','A','Mercedes-Benz Stadium - Atlanta',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Tchéquia' AND team_b='África do Sul') OR (team_a='África do Sul' AND team_b='Tchéquia'));

UPDATE matches SET match_date='2026-06-19T01:00:00+00:00', venue='Estadio Akron - Guadalajara',            phase='groups', group_name='A', round_number=2 WHERE (team_a='México' AND team_b='Coreia do Sul') OR (team_a='Coreia do Sul' AND team_b='México');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'México','Coreia do Sul','🇲🇽','🇰🇷','2026-06-19T01:00:00+00:00','groups','A','Estadio Akron - Guadalajara',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='México' AND team_b='Coreia do Sul') OR (team_a='Coreia do Sul' AND team_b='México'));

UPDATE matches SET match_date='2026-06-25T01:00:00+00:00', venue='Estadio Azteca - Cidade do México',      phase='groups', group_name='A', round_number=3 WHERE (team_a='Tchéquia' AND team_b='México') OR (team_a='México' AND team_b='Tchéquia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Tchéquia','México','🇨🇿','🇲🇽','2026-06-25T01:00:00+00:00','groups','A','Estadio Azteca - Cidade do México',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Tchéquia' AND team_b='México') OR (team_a='México' AND team_b='Tchéquia'));

UPDATE matches SET match_date='2026-06-25T01:00:00+00:00', venue='Estadio BBVA - Monterrey',               phase='groups', group_name='A', round_number=3 WHERE (team_a='África do Sul' AND team_b='Coreia do Sul') OR (team_a='Coreia do Sul' AND team_b='África do Sul');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'África do Sul','Coreia do Sul','🇿🇦','🇰🇷','2026-06-25T01:00:00+00:00','groups','A','Estadio BBVA - Monterrey',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='África do Sul' AND team_b='Coreia do Sul') OR (team_a='Coreia do Sul' AND team_b='África do Sul'));

-- ============================================================
-- GRUPO B: Canadá, Bósnia, Catar, Suíça
-- ============================================================
UPDATE matches SET match_date='2026-06-12T19:00:00+00:00', venue='BMO Field - Toronto',                    phase='groups', group_name='B', round_number=1 WHERE (team_a='Canadá' AND team_b='Bósnia') OR (team_a='Bósnia' AND team_b='Canadá');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Canadá','Bósnia','🇨🇦','🇧🇦','2026-06-12T19:00:00+00:00','groups','B','BMO Field - Toronto',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Canadá' AND team_b='Bósnia') OR (team_a='Bósnia' AND team_b='Canadá'));

UPDATE matches SET match_date='2026-06-13T19:00:00+00:00', venue='Levi''s Stadium - San Francisco',        phase='groups', group_name='B', round_number=1 WHERE (team_a='Catar' AND team_b='Suíça') OR (team_a='Suíça' AND team_b='Catar');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Catar','Suíça','🇶🇦','🇨🇭','2026-06-13T19:00:00+00:00','groups','B','Levi''s Stadium - San Francisco',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Catar' AND team_b='Suíça') OR (team_a='Suíça' AND team_b='Catar'));

UPDATE matches SET match_date='2026-06-18T19:00:00+00:00', venue='SoFi Stadium - Los Angeles',             phase='groups', group_name='B', round_number=2 WHERE (team_a='Suíça' AND team_b='Bósnia') OR (team_a='Bósnia' AND team_b='Suíça');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Suíça','Bósnia','🇨🇭','🇧🇦','2026-06-18T19:00:00+00:00','groups','B','SoFi Stadium - Los Angeles',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Suíça' AND team_b='Bósnia') OR (team_a='Bósnia' AND team_b='Suíça'));

UPDATE matches SET match_date='2026-06-18T22:00:00+00:00', venue='BC Place - Vancouver',                   phase='groups', group_name='B', round_number=2 WHERE (team_a='Canadá' AND team_b='Catar') OR (team_a='Catar' AND team_b='Canadá');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Canadá','Catar','🇨🇦','🇶🇦','2026-06-18T22:00:00+00:00','groups','B','BC Place - Vancouver',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Canadá' AND team_b='Catar') OR (team_a='Catar' AND team_b='Canadá'));

UPDATE matches SET match_date='2026-06-24T19:00:00+00:00', venue='BC Place - Vancouver',                   phase='groups', group_name='B', round_number=3 WHERE (team_a='Suíça' AND team_b='Canadá') OR (team_a='Canadá' AND team_b='Suíça');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Suíça','Canadá','🇨🇭','🇨🇦','2026-06-24T19:00:00+00:00','groups','B','BC Place - Vancouver',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Suíça' AND team_b='Canadá') OR (team_a='Canadá' AND team_b='Suíça'));

UPDATE matches SET match_date='2026-06-24T19:00:00+00:00', venue='Lumen Field - Seattle',                  phase='groups', group_name='B', round_number=3 WHERE (team_a='Bósnia' AND team_b='Catar') OR (team_a='Catar' AND team_b='Bósnia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Bósnia','Catar','🇧🇦','🇶🇦','2026-06-24T19:00:00+00:00','groups','B','Lumen Field - Seattle',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Bósnia' AND team_b='Catar') OR (team_a='Catar' AND team_b='Bósnia'));

-- ============================================================
-- GRUPO C: Brasil, Marrocos, Haiti, Escócia
-- ============================================================
UPDATE matches SET match_date='2026-06-13T22:00:00+00:00', venue='MetLife Stadium - Nova York',            phase='groups', group_name='C', round_number=1 WHERE (team_a='Brasil' AND team_b='Marrocos') OR (team_a='Marrocos' AND team_b='Brasil');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Brasil','Marrocos','🇧🇷','🇲🇦','2026-06-13T22:00:00+00:00','groups','C','MetLife Stadium - Nova York',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Brasil' AND team_b='Marrocos') OR (team_a='Marrocos' AND team_b='Brasil'));

UPDATE matches SET match_date='2026-06-14T01:00:00+00:00', venue='Gillette Stadium - Boston',              phase='groups', group_name='C', round_number=1 WHERE (team_a='Haiti' AND team_b='Escócia') OR (team_a='Escócia' AND team_b='Haiti');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Haiti','Escócia','🇭🇹','🏴󠁧󠁢󠁳󠁣󠁴󠁿','2026-06-14T01:00:00+00:00','groups','C','Gillette Stadium - Boston',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Haiti' AND team_b='Escócia') OR (team_a='Escócia' AND team_b='Haiti'));

UPDATE matches SET match_date='2026-06-19T22:00:00+00:00', venue='Gillette Stadium - Boston',              phase='groups', group_name='C', round_number=2 WHERE (team_a='Escócia' AND team_b='Marrocos') OR (team_a='Marrocos' AND team_b='Escócia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Escócia','Marrocos','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇲🇦','2026-06-19T22:00:00+00:00','groups','C','Gillette Stadium - Boston',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Escócia' AND team_b='Marrocos') OR (team_a='Marrocos' AND team_b='Escócia'));

UPDATE matches SET match_date='2026-06-20T00:30:00+00:00', venue='Lincoln Financial Field - Philadelphia', phase='groups', group_name='C', round_number=2 WHERE (team_a='Brasil' AND team_b='Haiti') OR (team_a='Haiti' AND team_b='Brasil');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Brasil','Haiti','🇧🇷','🇭🇹','2026-06-20T00:30:00+00:00','groups','C','Lincoln Financial Field - Philadelphia',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Brasil' AND team_b='Haiti') OR (team_a='Haiti' AND team_b='Brasil'));

UPDATE matches SET match_date='2026-06-24T22:00:00+00:00', venue='Hard Rock Stadium - Miami',              phase='groups', group_name='C', round_number=3 WHERE (team_a='Escócia' AND team_b='Brasil') OR (team_a='Brasil' AND team_b='Escócia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Escócia','Brasil','🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇧🇷','2026-06-24T22:00:00+00:00','groups','C','Hard Rock Stadium - Miami',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Escócia' AND team_b='Brasil') OR (team_a='Brasil' AND team_b='Escócia'));

UPDATE matches SET match_date='2026-06-24T22:00:00+00:00', venue='Mercedes-Benz Stadium - Atlanta',        phase='groups', group_name='C', round_number=3 WHERE (team_a='Marrocos' AND team_b='Haiti') OR (team_a='Haiti' AND team_b='Marrocos');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Marrocos','Haiti','🇲🇦','🇭🇹','2026-06-24T22:00:00+00:00','groups','C','Mercedes-Benz Stadium - Atlanta',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Marrocos' AND team_b='Haiti') OR (team_a='Haiti' AND team_b='Marrocos'));

-- ============================================================
-- GRUPO D: Estados Unidos, Paraguai, Austrália, Turquia
-- ============================================================
UPDATE matches SET match_date='2026-06-13T01:00:00+00:00', venue='SoFi Stadium - Los Angeles',             phase='groups', group_name='D', round_number=1 WHERE (team_a='Estados Unidos' AND team_b='Paraguai') OR (team_a='Paraguai' AND team_b='Estados Unidos');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Estados Unidos','Paraguai','🇺🇸','🇵🇾','2026-06-13T01:00:00+00:00','groups','D','SoFi Stadium - Los Angeles',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Estados Unidos' AND team_b='Paraguai') OR (team_a='Paraguai' AND team_b='Estados Unidos'));

UPDATE matches SET match_date='2026-06-14T04:00:00+00:00', venue='BC Place - Vancouver',                   phase='groups', group_name='D', round_number=1 WHERE (team_a='Austrália' AND team_b='Turquia') OR (team_a='Turquia' AND team_b='Austrália');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Austrália','Turquia','🇦🇺','🇹🇷','2026-06-14T04:00:00+00:00','groups','D','BC Place - Vancouver',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Austrália' AND team_b='Turquia') OR (team_a='Turquia' AND team_b='Austrália'));

UPDATE matches SET match_date='2026-06-19T19:00:00+00:00', venue='Lumen Field - Seattle',                  phase='groups', group_name='D', round_number=2 WHERE (team_a='Estados Unidos' AND team_b='Austrália') OR (team_a='Austrália' AND team_b='Estados Unidos');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Estados Unidos','Austrália','🇺🇸','🇦🇺','2026-06-19T19:00:00+00:00','groups','D','Lumen Field - Seattle',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Estados Unidos' AND team_b='Austrália') OR (team_a='Austrália' AND team_b='Estados Unidos'));

UPDATE matches SET match_date='2026-06-20T03:00:00+00:00', venue='Levi''s Stadium - San Francisco',        phase='groups', group_name='D', round_number=2 WHERE (team_a='Turquia' AND team_b='Paraguai') OR (team_a='Paraguai' AND team_b='Turquia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Turquia','Paraguai','🇹🇷','🇵🇾','2026-06-20T03:00:00+00:00','groups','D','Levi''s Stadium - San Francisco',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Turquia' AND team_b='Paraguai') OR (team_a='Paraguai' AND team_b='Turquia'));

UPDATE matches SET match_date='2026-06-26T02:00:00+00:00', venue='SoFi Stadium - Los Angeles',             phase='groups', group_name='D', round_number=3 WHERE (team_a='Turquia' AND team_b='Estados Unidos') OR (team_a='Estados Unidos' AND team_b='Turquia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Turquia','Estados Unidos','🇹🇷','🇺🇸','2026-06-26T02:00:00+00:00','groups','D','SoFi Stadium - Los Angeles',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Turquia' AND team_b='Estados Unidos') OR (team_a='Estados Unidos' AND team_b='Turquia'));

UPDATE matches SET match_date='2026-06-26T02:00:00+00:00', venue='Levi''s Stadium - San Francisco',        phase='groups', group_name='D', round_number=3 WHERE (team_a='Paraguai' AND team_b='Austrália') OR (team_a='Austrália' AND team_b='Paraguai');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Paraguai','Austrália','🇵🇾','🇦🇺','2026-06-26T02:00:00+00:00','groups','D','Levi''s Stadium - San Francisco',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Paraguai' AND team_b='Austrália') OR (team_a='Austrália' AND team_b='Paraguai'));

-- ============================================================
-- GRUPO E: Alemanha, Curaçao, Costa do Marfim, Equador
-- ============================================================
UPDATE matches SET match_date='2026-06-14T17:00:00+00:00', venue='NRG Stadium - Houston',                  phase='groups', group_name='E', round_number=1 WHERE (team_a='Alemanha' AND team_b='Curaçao') OR (team_a='Curaçao' AND team_b='Alemanha');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Alemanha','Curaçao','🇩🇪','🇨🇼','2026-06-14T17:00:00+00:00','groups','E','NRG Stadium - Houston',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Alemanha' AND team_b='Curaçao') OR (team_a='Curaçao' AND team_b='Alemanha'));

UPDATE matches SET match_date='2026-06-14T23:00:00+00:00', venue='Lincoln Financial Field - Philadelphia', phase='groups', group_name='E', round_number=1 WHERE (team_a='Costa do Marfim' AND team_b='Equador') OR (team_a='Equador' AND team_b='Costa do Marfim');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Costa do Marfim','Equador','🇨🇮','🇪🇨','2026-06-14T23:00:00+00:00','groups','E','Lincoln Financial Field - Philadelphia',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Costa do Marfim' AND team_b='Equador') OR (team_a='Equador' AND team_b='Costa do Marfim'));

UPDATE matches SET match_date='2026-06-20T20:00:00+00:00', venue='BMO Field - Toronto',                    phase='groups', group_name='E', round_number=2 WHERE (team_a='Alemanha' AND team_b='Costa do Marfim') OR (team_a='Costa do Marfim' AND team_b='Alemanha');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Alemanha','Costa do Marfim','🇩🇪','🇨🇮','2026-06-20T20:00:00+00:00','groups','E','BMO Field - Toronto',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Alemanha' AND team_b='Costa do Marfim') OR (team_a='Costa do Marfim' AND team_b='Alemanha'));

UPDATE matches SET match_date='2026-06-21T00:00:00+00:00', venue='Arrowhead Stadium - Kansas City',        phase='groups', group_name='E', round_number=2 WHERE (team_a='Equador' AND team_b='Curaçao') OR (team_a='Curaçao' AND team_b='Equador');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Equador','Curaçao','🇪🇨','🇨🇼','2026-06-21T00:00:00+00:00','groups','E','Arrowhead Stadium - Kansas City',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Equador' AND team_b='Curaçao') OR (team_a='Curaçao' AND team_b='Equador'));

UPDATE matches SET match_date='2026-06-25T20:00:00+00:00', venue='Lincoln Financial Field - Philadelphia', phase='groups', group_name='E', round_number=3 WHERE (team_a='Curaçao' AND team_b='Costa do Marfim') OR (team_a='Costa do Marfim' AND team_b='Curaçao');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Curaçao','Costa do Marfim','🇨🇼','🇨🇮','2026-06-25T20:00:00+00:00','groups','E','Lincoln Financial Field - Philadelphia',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Curaçao' AND team_b='Costa do Marfim') OR (team_a='Costa do Marfim' AND team_b='Curaçao'));

UPDATE matches SET match_date='2026-06-25T20:00:00+00:00', venue='MetLife Stadium - Nova York',            phase='groups', group_name='E', round_number=3 WHERE (team_a='Equador' AND team_b='Alemanha') OR (team_a='Alemanha' AND team_b='Equador');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Equador','Alemanha','🇪🇨','🇩🇪','2026-06-25T20:00:00+00:00','groups','E','MetLife Stadium - Nova York',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Equador' AND team_b='Alemanha') OR (team_a='Alemanha' AND team_b='Equador'));

-- ============================================================
-- GRUPO F: Holanda, Japão, Suécia, Tunísia
-- ============================================================
UPDATE matches SET match_date='2026-06-14T20:00:00+00:00', venue='AT&T Stadium - Dallas',                  phase='groups', group_name='F', round_number=1 WHERE (team_a='Holanda' AND team_b='Japão') OR (team_a='Japão' AND team_b='Holanda');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Holanda','Japão','🇳🇱','🇯🇵','2026-06-14T20:00:00+00:00','groups','F','AT&T Stadium - Dallas',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Holanda' AND team_b='Japão') OR (team_a='Japão' AND team_b='Holanda'));

UPDATE matches SET match_date='2026-06-15T02:00:00+00:00', venue='Estadio BBVA - Monterrey',               phase='groups', group_name='F', round_number=1 WHERE (team_a='Suécia' AND team_b='Tunísia') OR (team_a='Tunísia' AND team_b='Suécia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Suécia','Tunísia','🇸🇪','🇹🇳','2026-06-15T02:00:00+00:00','groups','F','Estadio BBVA - Monterrey',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Suécia' AND team_b='Tunísia') OR (team_a='Tunísia' AND team_b='Suécia'));

UPDATE matches SET match_date='2026-06-20T17:00:00+00:00', venue='NRG Stadium - Houston',                  phase='groups', group_name='F', round_number=2 WHERE (team_a='Holanda' AND team_b='Suécia') OR (team_a='Suécia' AND team_b='Holanda');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Holanda','Suécia','🇳🇱','🇸🇪','2026-06-20T17:00:00+00:00','groups','F','NRG Stadium - Houston',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Holanda' AND team_b='Suécia') OR (team_a='Suécia' AND team_b='Holanda'));

UPDATE matches SET match_date='2026-06-21T04:00:00+00:00', venue='Estadio BBVA - Monterrey',               phase='groups', group_name='F', round_number=2 WHERE (team_a='Tunísia' AND team_b='Japão') OR (team_a='Japão' AND team_b='Tunísia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Tunísia','Japão','🇹🇳','🇯🇵','2026-06-21T04:00:00+00:00','groups','F','Estadio BBVA - Monterrey',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Tunísia' AND team_b='Japão') OR (team_a='Japão' AND team_b='Tunísia'));

UPDATE matches SET match_date='2026-06-25T23:00:00+00:00', venue='AT&T Stadium - Dallas',                  phase='groups', group_name='F', round_number=3 WHERE (team_a='Japão' AND team_b='Suécia') OR (team_a='Suécia' AND team_b='Japão');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Japão','Suécia','🇯🇵','🇸🇪','2026-06-25T23:00:00+00:00','groups','F','AT&T Stadium - Dallas',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Japão' AND team_b='Suécia') OR (team_a='Suécia' AND team_b='Japão'));

UPDATE matches SET match_date='2026-06-25T23:00:00+00:00', venue='Arrowhead Stadium - Kansas City',        phase='groups', group_name='F', round_number=3 WHERE (team_a='Tunísia' AND team_b='Holanda') OR (team_a='Holanda' AND team_b='Tunísia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Tunísia','Holanda','🇹🇳','🇳🇱','2026-06-25T23:00:00+00:00','groups','F','Arrowhead Stadium - Kansas City',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Tunísia' AND team_b='Holanda') OR (team_a='Holanda' AND team_b='Tunísia'));

-- ============================================================
-- GRUPO G: Bélgica, Egito, Irã, Nova Zelândia
-- ============================================================
UPDATE matches SET match_date='2026-06-15T19:00:00+00:00', venue='Lumen Field - Seattle',                  phase='groups', group_name='G', round_number=1 WHERE (team_a='Bélgica' AND team_b='Egito') OR (team_a='Egito' AND team_b='Bélgica');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Bélgica','Egito','🇧🇪','🇪🇬','2026-06-15T19:00:00+00:00','groups','G','Lumen Field - Seattle',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Bélgica' AND team_b='Egito') OR (team_a='Egito' AND team_b='Bélgica'));

UPDATE matches SET match_date='2026-06-16T01:00:00+00:00', venue='SoFi Stadium - Los Angeles',             phase='groups', group_name='G', round_number=1 WHERE (team_a='Irã' AND team_b='Nova Zelândia') OR (team_a='Nova Zelândia' AND team_b='Irã');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Irã','Nova Zelândia','🇮🇷','🇳🇿','2026-06-16T01:00:00+00:00','groups','G','SoFi Stadium - Los Angeles',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Irã' AND team_b='Nova Zelândia') OR (team_a='Nova Zelândia' AND team_b='Irã'));

UPDATE matches SET match_date='2026-06-21T19:00:00+00:00', venue='SoFi Stadium - Los Angeles',             phase='groups', group_name='G', round_number=2 WHERE (team_a='Bélgica' AND team_b='Irã') OR (team_a='Irã' AND team_b='Bélgica');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Bélgica','Irã','🇧🇪','🇮🇷','2026-06-21T19:00:00+00:00','groups','G','SoFi Stadium - Los Angeles',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Bélgica' AND team_b='Irã') OR (team_a='Irã' AND team_b='Bélgica'));

UPDATE matches SET match_date='2026-06-22T01:00:00+00:00', venue='BC Place - Vancouver',                   phase='groups', group_name='G', round_number=2 WHERE (team_a='Nova Zelândia' AND team_b='Egito') OR (team_a='Egito' AND team_b='Nova Zelândia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Nova Zelândia','Egito','🇳🇿','🇪🇬','2026-06-22T01:00:00+00:00','groups','G','BC Place - Vancouver',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Nova Zelândia' AND team_b='Egito') OR (team_a='Egito' AND team_b='Nova Zelândia'));

UPDATE matches SET match_date='2026-06-27T03:00:00+00:00', venue='Lumen Field - Seattle',                  phase='groups', group_name='G', round_number=3 WHERE (team_a='Egito' AND team_b='Irã') OR (team_a='Irã' AND team_b='Egito');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Egito','Irã','🇪🇬','🇮🇷','2026-06-27T03:00:00+00:00','groups','G','Lumen Field - Seattle',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Egito' AND team_b='Irã') OR (team_a='Irã' AND team_b='Egito'));

UPDATE matches SET match_date='2026-06-27T03:00:00+00:00', venue='BC Place - Vancouver',                   phase='groups', group_name='G', round_number=3 WHERE (team_a='Nova Zelândia' AND team_b='Bélgica') OR (team_a='Bélgica' AND team_b='Nova Zelândia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Nova Zelândia','Bélgica','🇳🇿','🇧🇪','2026-06-27T03:00:00+00:00','groups','G','BC Place - Vancouver',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Nova Zelândia' AND team_b='Bélgica') OR (team_a='Bélgica' AND team_b='Nova Zelândia'));

-- ============================================================
-- GRUPO H: Espanha, Cabo Verde, Arábia Saudita, Uruguai
-- ============================================================
UPDATE matches SET match_date='2026-06-15T16:00:00+00:00', venue='Mercedes-Benz Stadium - Atlanta',        phase='groups', group_name='H', round_number=1 WHERE (team_a='Espanha' AND team_b='Cabo Verde') OR (team_a='Cabo Verde' AND team_b='Espanha');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Espanha','Cabo Verde','🇪🇸','🇨🇻','2026-06-15T16:00:00+00:00','groups','H','Mercedes-Benz Stadium - Atlanta',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Espanha' AND team_b='Cabo Verde') OR (team_a='Cabo Verde' AND team_b='Espanha'));

UPDATE matches SET match_date='2026-06-15T22:00:00+00:00', venue='Hard Rock Stadium - Miami',              phase='groups', group_name='H', round_number=1 WHERE (team_a='Arábia Saudita' AND team_b='Uruguai') OR (team_a='Uruguai' AND team_b='Arábia Saudita');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Arábia Saudita','Uruguai','🇸🇦','🇺🇾','2026-06-15T22:00:00+00:00','groups','H','Hard Rock Stadium - Miami',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Arábia Saudita' AND team_b='Uruguai') OR (team_a='Uruguai' AND team_b='Arábia Saudita'));

UPDATE matches SET match_date='2026-06-21T16:00:00+00:00', venue='Mercedes-Benz Stadium - Atlanta',        phase='groups', group_name='H', round_number=2 WHERE (team_a='Espanha' AND team_b='Arábia Saudita') OR (team_a='Arábia Saudita' AND team_b='Espanha');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Espanha','Arábia Saudita','🇪🇸','🇸🇦','2026-06-21T16:00:00+00:00','groups','H','Mercedes-Benz Stadium - Atlanta',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Espanha' AND team_b='Arábia Saudita') OR (team_a='Arábia Saudita' AND team_b='Espanha'));

UPDATE matches SET match_date='2026-06-21T22:00:00+00:00', venue='Hard Rock Stadium - Miami',              phase='groups', group_name='H', round_number=2 WHERE (team_a='Uruguai' AND team_b='Cabo Verde') OR (team_a='Cabo Verde' AND team_b='Uruguai');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Uruguai','Cabo Verde','🇺🇾','🇨🇻','2026-06-21T22:00:00+00:00','groups','H','Hard Rock Stadium - Miami',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Uruguai' AND team_b='Cabo Verde') OR (team_a='Cabo Verde' AND team_b='Uruguai'));

UPDATE matches SET match_date='2026-06-27T00:00:00+00:00', venue='NRG Stadium - Houston',                  phase='groups', group_name='H', round_number=3 WHERE (team_a='Cabo Verde' AND team_b='Arábia Saudita') OR (team_a='Arábia Saudita' AND team_b='Cabo Verde');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Cabo Verde','Arábia Saudita','🇨🇻','🇸🇦','2026-06-27T00:00:00+00:00','groups','H','NRG Stadium - Houston',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Cabo Verde' AND team_b='Arábia Saudita') OR (team_a='Arábia Saudita' AND team_b='Cabo Verde'));

UPDATE matches SET match_date='2026-06-27T00:00:00+00:00', venue='Estadio Akron - Guadalajara',            phase='groups', group_name='H', round_number=3 WHERE (team_a='Uruguai' AND team_b='Espanha') OR (team_a='Espanha' AND team_b='Uruguai');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Uruguai','Espanha','🇺🇾','🇪🇸','2026-06-27T00:00:00+00:00','groups','H','Estadio Akron - Guadalajara',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Uruguai' AND team_b='Espanha') OR (team_a='Espanha' AND team_b='Uruguai'));

-- ============================================================
-- GRUPO I: França, Senegal, Iraque, Noruega
-- ============================================================
UPDATE matches SET match_date='2026-06-16T19:00:00+00:00', venue='MetLife Stadium - Nova York',            phase='groups', group_name='I', round_number=1 WHERE (team_a='França' AND team_b='Senegal') OR (team_a='Senegal' AND team_b='França');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'França','Senegal','🇫🇷','🇸🇳','2026-06-16T19:00:00+00:00','groups','I','MetLife Stadium - Nova York',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='França' AND team_b='Senegal') OR (team_a='Senegal' AND team_b='França'));

UPDATE matches SET match_date='2026-06-16T22:00:00+00:00', venue='Gillette Stadium - Boston',              phase='groups', group_name='I', round_number=1 WHERE (team_a='Iraque' AND team_b='Noruega') OR (team_a='Noruega' AND team_b='Iraque');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Iraque','Noruega','🇮🇶','🇳🇴','2026-06-16T22:00:00+00:00','groups','I','Gillette Stadium - Boston',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Iraque' AND team_b='Noruega') OR (team_a='Noruega' AND team_b='Iraque'));

UPDATE matches SET match_date='2026-06-22T21:00:00+00:00', venue='Lincoln Financial Field - Philadelphia', phase='groups', group_name='I', round_number=2 WHERE (team_a='França' AND team_b='Iraque') OR (team_a='Iraque' AND team_b='França');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'França','Iraque','🇫🇷','🇮🇶','2026-06-22T21:00:00+00:00','groups','I','Lincoln Financial Field - Philadelphia',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='França' AND team_b='Iraque') OR (team_a='Iraque' AND team_b='França'));

UPDATE matches SET match_date='2026-06-23T00:00:00+00:00', venue='MetLife Stadium - Nova York',            phase='groups', group_name='I', round_number=2 WHERE (team_a='Noruega' AND team_b='Senegal') OR (team_a='Senegal' AND team_b='Noruega');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Noruega','Senegal','🇳🇴','🇸🇳','2026-06-23T00:00:00+00:00','groups','I','MetLife Stadium - Nova York',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Noruega' AND team_b='Senegal') OR (team_a='Senegal' AND team_b='Noruega'));

UPDATE matches SET match_date='2026-06-26T19:00:00+00:00', venue='Gillette Stadium - Boston',              phase='groups', group_name='I', round_number=3 WHERE (team_a='Noruega' AND team_b='França') OR (team_a='França' AND team_b='Noruega');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Noruega','França','🇳🇴','🇫🇷','2026-06-26T19:00:00+00:00','groups','I','Gillette Stadium - Boston',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Noruega' AND team_b='França') OR (team_a='França' AND team_b='Noruega'));

UPDATE matches SET match_date='2026-06-26T19:00:00+00:00', venue='BMO Field - Toronto',                    phase='groups', group_name='I', round_number=3 WHERE (team_a='Senegal' AND team_b='Iraque') OR (team_a='Iraque' AND team_b='Senegal');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Senegal','Iraque','🇸🇳','🇮🇶','2026-06-26T19:00:00+00:00','groups','I','BMO Field - Toronto',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Senegal' AND team_b='Iraque') OR (team_a='Iraque' AND team_b='Senegal'));

-- ============================================================
-- GRUPO J: Argentina, Argélia, Áustria, Jordânia
-- ============================================================
UPDATE matches SET match_date='2026-06-17T01:00:00+00:00', venue='Arrowhead Stadium - Kansas City',        phase='groups', group_name='J', round_number=1 WHERE (team_a='Argentina' AND team_b='Argélia') OR (team_a='Argélia' AND team_b='Argentina');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Argentina','Argélia','🇦🇷','🇩🇿','2026-06-17T01:00:00+00:00','groups','J','Arrowhead Stadium - Kansas City',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Argentina' AND team_b='Argélia') OR (team_a='Argélia' AND team_b='Argentina'));

UPDATE matches SET match_date='2026-06-17T04:00:00+00:00', venue='Levi''s Stadium - San Francisco',        phase='groups', group_name='J', round_number=1 WHERE (team_a='Áustria' AND team_b='Jordânia') OR (team_a='Jordânia' AND team_b='Áustria');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Áustria','Jordânia','🇦🇹','🇯🇴','2026-06-17T04:00:00+00:00','groups','J','Levi''s Stadium - San Francisco',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Áustria' AND team_b='Jordânia') OR (team_a='Jordânia' AND team_b='Áustria'));

UPDATE matches SET match_date='2026-06-22T17:00:00+00:00', venue='AT&T Stadium - Dallas',                  phase='groups', group_name='J', round_number=2 WHERE (team_a='Argentina' AND team_b='Áustria') OR (team_a='Áustria' AND team_b='Argentina');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Argentina','Áustria','🇦🇷','🇦🇹','2026-06-22T17:00:00+00:00','groups','J','AT&T Stadium - Dallas',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Argentina' AND team_b='Áustria') OR (team_a='Áustria' AND team_b='Argentina'));

UPDATE matches SET match_date='2026-06-23T03:00:00+00:00', venue='Levi''s Stadium - San Francisco',        phase='groups', group_name='J', round_number=2 WHERE (team_a='Jordânia' AND team_b='Argélia') OR (team_a='Argélia' AND team_b='Jordânia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Jordânia','Argélia','🇯🇴','🇩🇿','2026-06-23T03:00:00+00:00','groups','J','Levi''s Stadium - San Francisco',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Jordânia' AND team_b='Argélia') OR (team_a='Argélia' AND team_b='Jordânia'));

UPDATE matches SET match_date='2026-06-28T02:00:00+00:00', venue='Arrowhead Stadium - Kansas City',        phase='groups', group_name='J', round_number=3 WHERE (team_a='Argélia' AND team_b='Áustria') OR (team_a='Áustria' AND team_b='Argélia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Argélia','Áustria','🇩🇿','🇦🇹','2026-06-28T02:00:00+00:00','groups','J','Arrowhead Stadium - Kansas City',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Argélia' AND team_b='Áustria') OR (team_a='Áustria' AND team_b='Argélia'));

UPDATE matches SET match_date='2026-06-28T02:00:00+00:00', venue='AT&T Stadium - Dallas',                  phase='groups', group_name='J', round_number=3 WHERE (team_a='Jordânia' AND team_b='Argentina') OR (team_a='Argentina' AND team_b='Jordânia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Jordânia','Argentina','🇯🇴','🇦🇷','2026-06-28T02:00:00+00:00','groups','J','AT&T Stadium - Dallas',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Jordânia' AND team_b='Argentina') OR (team_a='Argentina' AND team_b='Jordânia'));

-- ============================================================
-- GRUPO K: Portugal, RD Congo, Uzbequistão, Colômbia
-- ============================================================
UPDATE matches SET match_date='2026-06-17T17:00:00+00:00', venue='NRG Stadium - Houston',                  phase='groups', group_name='K', round_number=1 WHERE (team_a='Portugal' AND team_b='RD Congo') OR (team_a='RD Congo' AND team_b='Portugal');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Portugal','RD Congo','🇵🇹','🇨🇩','2026-06-17T17:00:00+00:00','groups','K','NRG Stadium - Houston',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Portugal' AND team_b='RD Congo') OR (team_a='RD Congo' AND team_b='Portugal'));

UPDATE matches SET match_date='2026-06-18T02:00:00+00:00', venue='Estadio Azteca - Cidade do México',      phase='groups', group_name='K', round_number=1 WHERE (team_a='Uzbequistão' AND team_b='Colômbia') OR (team_a='Colômbia' AND team_b='Uzbequistão');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Uzbequistão','Colômbia','🇺🇿','🇨🇴','2026-06-18T02:00:00+00:00','groups','K','Estadio Azteca - Cidade do México',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Uzbequistão' AND team_b='Colômbia') OR (team_a='Colômbia' AND team_b='Uzbequistão'));

UPDATE matches SET match_date='2026-06-23T17:00:00+00:00', venue='NRG Stadium - Houston',                  phase='groups', group_name='K', round_number=2 WHERE (team_a='Portugal' AND team_b='Uzbequistão') OR (team_a='Uzbequistão' AND team_b='Portugal');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Portugal','Uzbequistão','🇵🇹','🇺🇿','2026-06-23T17:00:00+00:00','groups','K','NRG Stadium - Houston',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Portugal' AND team_b='Uzbequistão') OR (team_a='Uzbequistão' AND team_b='Portugal'));

UPDATE matches SET match_date='2026-06-24T02:00:00+00:00', venue='Estadio Akron - Guadalajara',            phase='groups', group_name='K', round_number=2 WHERE (team_a='Colômbia' AND team_b='RD Congo') OR (team_a='RD Congo' AND team_b='Colômbia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Colômbia','RD Congo','🇨🇴','🇨🇩','2026-06-24T02:00:00+00:00','groups','K','Estadio Akron - Guadalajara',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Colômbia' AND team_b='RD Congo') OR (team_a='RD Congo' AND team_b='Colômbia'));

UPDATE matches SET match_date='2026-06-27T23:30:00+00:00', venue='Hard Rock Stadium - Miami',              phase='groups', group_name='K', round_number=3 WHERE (team_a='Colômbia' AND team_b='Portugal') OR (team_a='Portugal' AND team_b='Colômbia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Colômbia','Portugal','🇨🇴','🇵🇹','2026-06-27T23:30:00+00:00','groups','K','Hard Rock Stadium - Miami',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Colômbia' AND team_b='Portugal') OR (team_a='Portugal' AND team_b='Colômbia'));

UPDATE matches SET match_date='2026-06-27T23:30:00+00:00', venue='Mercedes-Benz Stadium - Atlanta',        phase='groups', group_name='K', round_number=3 WHERE (team_a='RD Congo' AND team_b='Uzbequistão') OR (team_a='Uzbequistão' AND team_b='RD Congo');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'RD Congo','Uzbequistão','🇨🇩','🇺🇿','2026-06-27T23:30:00+00:00','groups','K','Mercedes-Benz Stadium - Atlanta',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='RD Congo' AND team_b='Uzbequistão') OR (team_a='Uzbequistão' AND team_b='RD Congo'));

-- ============================================================
-- GRUPO L: Inglaterra, Croácia, Gana, Panamá
-- ============================================================
UPDATE matches SET match_date='2026-06-17T20:00:00+00:00', venue='AT&T Stadium - Dallas',                  phase='groups', group_name='L', round_number=1 WHERE (team_a='Inglaterra' AND team_b='Croácia') OR (team_a='Croácia' AND team_b='Inglaterra');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Inglaterra','Croácia','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇭🇷','2026-06-17T20:00:00+00:00','groups','L','AT&T Stadium - Dallas',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Inglaterra' AND team_b='Croácia') OR (team_a='Croácia' AND team_b='Inglaterra'));

UPDATE matches SET match_date='2026-06-17T23:00:00+00:00', venue='BMO Field - Toronto',                    phase='groups', group_name='L', round_number=1 WHERE (team_a='Gana' AND team_b='Panamá') OR (team_a='Panamá' AND team_b='Gana');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Gana','Panamá','🇬🇭','🇵🇦','2026-06-17T23:00:00+00:00','groups','L','BMO Field - Toronto',1,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Gana' AND team_b='Panamá') OR (team_a='Panamá' AND team_b='Gana'));

UPDATE matches SET match_date='2026-06-23T20:00:00+00:00', venue='Gillette Stadium - Boston',              phase='groups', group_name='L', round_number=2 WHERE (team_a='Inglaterra' AND team_b='Gana') OR (team_a='Gana' AND team_b='Inglaterra');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Inglaterra','Gana','🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇬🇭','2026-06-23T20:00:00+00:00','groups','L','Gillette Stadium - Boston',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Inglaterra' AND team_b='Gana') OR (team_a='Gana' AND team_b='Inglaterra'));

UPDATE matches SET match_date='2026-06-23T23:00:00+00:00', venue='BMO Field - Toronto',                    phase='groups', group_name='L', round_number=2 WHERE (team_a='Panamá' AND team_b='Croácia') OR (team_a='Croácia' AND team_b='Panamá');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Panamá','Croácia','🇵🇦','🇭🇷','2026-06-23T23:00:00+00:00','groups','L','BMO Field - Toronto',2,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Panamá' AND team_b='Croácia') OR (team_a='Croácia' AND team_b='Panamá'));

UPDATE matches SET match_date='2026-06-27T21:00:00+00:00', venue='MetLife Stadium - Nova York',            phase='groups', group_name='L', round_number=3 WHERE (team_a='Panamá' AND team_b='Inglaterra') OR (team_a='Inglaterra' AND team_b='Panamá');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Panamá','Inglaterra','🇵🇦','🏴󠁧󠁢󠁥󠁮󠁧󠁿','2026-06-27T21:00:00+00:00','groups','L','MetLife Stadium - Nova York',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Panamá' AND team_b='Inglaterra') OR (team_a='Inglaterra' AND team_b='Panamá'));

UPDATE matches SET match_date='2026-06-27T21:00:00+00:00', venue='Lincoln Financial Field - Philadelphia', phase='groups', group_name='L', round_number=3 WHERE (team_a='Croácia' AND team_b='Gana') OR (team_a='Gana' AND team_b='Croácia');
INSERT INTO matches (team_a,team_b,team_a_flag,team_b_flag,match_date,phase,group_name,venue,round_number,is_finished,is_locked) SELECT 'Croácia','Gana','🇭🇷','🇬🇭','2026-06-27T21:00:00+00:00','groups','L','Lincoln Financial Field - Philadelphia',3,false,false WHERE NOT EXISTS (SELECT 1 FROM matches WHERE (team_a='Croácia' AND team_b='Gana') OR (team_a='Gana' AND team_b='Croácia'));
