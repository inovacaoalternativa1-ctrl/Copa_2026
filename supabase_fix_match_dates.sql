-- ============================================================
-- Copa do Mundo 2026 - Correção de horários e locais
-- Fonte: ge.globo.com / trivela.com.br (calendário oficial)
-- Horários convertidos de BRT (UTC-3) para UTC
-- Execute no Supabase: SQL Editor → New query → Run
-- ============================================================

-- ============================================================
-- RODADA 1 — 11 a 17 de junho de 2026
-- ============================================================

-- 11 de junho
UPDATE matches SET match_date = '2026-06-11T19:00:00+00:00', venue = 'Estadio Azteca - Cidade do México',      group_name = 'A', round_number = 1
WHERE (team_a = 'México'       AND team_b = 'África do Sul') OR (team_a = 'África do Sul' AND team_b = 'México');

UPDATE matches SET match_date = '2026-06-12T02:00:00+00:00', venue = 'Estadio Akron - Guadalajara',            group_name = 'A', round_number = 1
WHERE (team_a = 'Coreia do Sul' AND team_b = 'Tchéquia')     OR (team_a = 'Tchéquia'      AND team_b = 'Coreia do Sul');

-- 12 de junho
UPDATE matches SET match_date = '2026-06-12T19:00:00+00:00', venue = 'BMO Field - Toronto',                    group_name = 'B', round_number = 1
WHERE (team_a = 'Canadá'       AND team_b = 'Bósnia')        OR (team_a = 'Bósnia'        AND team_b = 'Canadá');

UPDATE matches SET match_date = '2026-06-13T01:00:00+00:00', venue = 'SoFi Stadium - Los Angeles',             group_name = 'D', round_number = 1
WHERE (team_a = 'Estados Unidos' AND team_b = 'Paraguai')    OR (team_a = 'Paraguai'      AND team_b = 'Estados Unidos');

-- 13 de junho
UPDATE matches SET match_date = '2026-06-13T19:00:00+00:00', venue = 'Levi''s Stadium - San Francisco',        group_name = 'B', round_number = 1
WHERE (team_a = 'Catar'        AND team_b = 'Suíça')         OR (team_a = 'Suíça'         AND team_b = 'Catar');

UPDATE matches SET match_date = '2026-06-13T22:00:00+00:00', venue = 'MetLife Stadium - Nova York',            group_name = 'C', round_number = 1
WHERE (team_a = 'Brasil'       AND team_b = 'Marrocos')      OR (team_a = 'Marrocos'      AND team_b = 'Brasil');

UPDATE matches SET match_date = '2026-06-14T01:00:00+00:00', venue = 'Gillette Stadium - Boston',              group_name = 'C', round_number = 1
WHERE (team_a = 'Haiti'        AND team_b = 'Escócia')       OR (team_a = 'Escócia'       AND team_b = 'Haiti');

-- 14 de junho
UPDATE matches SET match_date = '2026-06-14T04:00:00+00:00', venue = 'BC Place - Vancouver',                   group_name = 'D', round_number = 1
WHERE (team_a = 'Austrália'    AND team_b = 'Turquia')       OR (team_a = 'Turquia'       AND team_b = 'Austrália');

UPDATE matches SET match_date = '2026-06-14T17:00:00+00:00', venue = 'NRG Stadium - Houston',                  group_name = 'E', round_number = 1
WHERE (team_a = 'Alemanha'     AND team_b = 'Curaçao')       OR (team_a = 'Curaçao'       AND team_b = 'Alemanha');

UPDATE matches SET match_date = '2026-06-14T20:00:00+00:00', venue = 'AT&T Stadium - Dallas',                  group_name = 'F', round_number = 1
WHERE (team_a = 'Holanda'      AND team_b = 'Japão')         OR (team_a = 'Japão'         AND team_b = 'Holanda');

UPDATE matches SET match_date = '2026-06-14T23:00:00+00:00', venue = 'Lincoln Financial Field - Philadelphia', group_name = 'E', round_number = 1
WHERE (team_a = 'Costa do Marfim' AND team_b = 'Equador')   OR (team_a = 'Equador'       AND team_b = 'Costa do Marfim');

UPDATE matches SET match_date = '2026-06-15T02:00:00+00:00', venue = 'Estadio BBVA - Monterrey',               group_name = 'F', round_number = 1
WHERE (team_a = 'Suécia'       AND team_b = 'Tunísia')       OR (team_a = 'Tunísia'       AND team_b = 'Suécia');

-- 15 de junho
UPDATE matches SET match_date = '2026-06-15T16:00:00+00:00', venue = 'Mercedes-Benz Stadium - Atlanta',        group_name = 'H', round_number = 1
WHERE (team_a = 'Espanha'      AND team_b = 'Cabo Verde')    OR (team_a = 'Cabo Verde'    AND team_b = 'Espanha');

UPDATE matches SET match_date = '2026-06-15T19:00:00+00:00', venue = 'Lumen Field - Seattle',                  group_name = 'G', round_number = 1
WHERE (team_a = 'Bélgica'      AND team_b = 'Egito')         OR (team_a = 'Egito'         AND team_b = 'Bélgica');

UPDATE matches SET match_date = '2026-06-15T22:00:00+00:00', venue = 'Hard Rock Stadium - Miami',              group_name = 'H', round_number = 1
WHERE (team_a = 'Arábia Saudita' AND team_b = 'Uruguai')    OR (team_a = 'Uruguai'       AND team_b = 'Arábia Saudita');

UPDATE matches SET match_date = '2026-06-16T01:00:00+00:00', venue = 'SoFi Stadium - Los Angeles',             group_name = 'G', round_number = 1
WHERE (team_a = 'Irã'          AND team_b = 'Nova Zelândia') OR (team_a = 'Nova Zelândia' AND team_b = 'Irã');

-- 16 de junho
UPDATE matches SET match_date = '2026-06-16T19:00:00+00:00', venue = 'MetLife Stadium - Nova York',            group_name = 'I', round_number = 1
WHERE (team_a = 'França'       AND team_b = 'Senegal')       OR (team_a = 'Senegal'       AND team_b = 'França');

UPDATE matches SET match_date = '2026-06-16T22:00:00+00:00', venue = 'Gillette Stadium - Boston',              group_name = 'I', round_number = 1
WHERE (team_a = 'Iraque'       AND team_b = 'Noruega')       OR (team_a = 'Noruega'       AND team_b = 'Iraque');

UPDATE matches SET match_date = '2026-06-17T01:00:00+00:00', venue = 'Arrowhead Stadium - Kansas City',        group_name = 'J', round_number = 1
WHERE (team_a = 'Argentina'    AND team_b = 'Argélia')       OR (team_a = 'Argélia'       AND team_b = 'Argentina');

-- 17 de junho
UPDATE matches SET match_date = '2026-06-17T04:00:00+00:00', venue = 'Levi''s Stadium - San Francisco',        group_name = 'J', round_number = 1
WHERE (team_a = 'Áustria'      AND team_b = 'Jordânia')      OR (team_a = 'Jordânia'      AND team_b = 'Áustria');

UPDATE matches SET match_date = '2026-06-17T17:00:00+00:00', venue = 'NRG Stadium - Houston',                  group_name = 'K', round_number = 1
WHERE (team_a = 'Portugal'     AND team_b = 'RD Congo')      OR (team_a = 'RD Congo'      AND team_b = 'Portugal');

UPDATE matches SET match_date = '2026-06-17T20:00:00+00:00', venue = 'AT&T Stadium - Dallas',                  group_name = 'L', round_number = 1
WHERE (team_a = 'Inglaterra'   AND team_b = 'Croácia')       OR (team_a = 'Croácia'       AND team_b = 'Inglaterra');

UPDATE matches SET match_date = '2026-06-17T23:00:00+00:00', venue = 'BMO Field - Toronto',                    group_name = 'L', round_number = 1
WHERE (team_a = 'Gana'         AND team_b = 'Panamá')        OR (team_a = 'Panamá'        AND team_b = 'Gana');

UPDATE matches SET match_date = '2026-06-18T02:00:00+00:00', venue = 'Estadio Azteca - Cidade do México',      group_name = 'K', round_number = 1
WHERE (team_a = 'Uzbequistão'  AND team_b = 'Colômbia')      OR (team_a = 'Colômbia'      AND team_b = 'Uzbequistão');

-- ============================================================
-- RODADA 2 — 18 a 23 de junho de 2026
-- ============================================================

-- 18 de junho
UPDATE matches SET match_date = '2026-06-18T16:00:00+00:00', venue = 'Mercedes-Benz Stadium - Atlanta',        group_name = 'A', round_number = 2
WHERE (team_a = 'Tchéquia'     AND team_b = 'África do Sul') OR (team_a = 'África do Sul' AND team_b = 'Tchéquia');

UPDATE matches SET match_date = '2026-06-18T19:00:00+00:00', venue = 'SoFi Stadium - Los Angeles',             group_name = 'B', round_number = 2
WHERE (team_a = 'Suíça'        AND team_b = 'Bósnia')        OR (team_a = 'Bósnia'        AND team_b = 'Suíça');

UPDATE matches SET match_date = '2026-06-18T22:00:00+00:00', venue = 'BC Place - Vancouver',                   group_name = 'B', round_number = 2
WHERE (team_a = 'Canadá'       AND team_b = 'Catar')         OR (team_a = 'Catar'         AND team_b = 'Canadá');

UPDATE matches SET match_date = '2026-06-19T01:00:00+00:00', venue = 'Estadio Akron - Guadalajara',            group_name = 'A', round_number = 2
WHERE (team_a = 'México'       AND team_b = 'Coreia do Sul') OR (team_a = 'Coreia do Sul' AND team_b = 'México');

-- 19 de junho
UPDATE matches SET match_date = '2026-06-19T19:00:00+00:00', venue = 'Lumen Field - Seattle',                  group_name = 'D', round_number = 2
WHERE (team_a = 'Estados Unidos' AND team_b = 'Austrália')   OR (team_a = 'Austrália'     AND team_b = 'Estados Unidos');

UPDATE matches SET match_date = '2026-06-19T22:00:00+00:00', venue = 'Gillette Stadium - Boston',              group_name = 'C', round_number = 2
WHERE (team_a = 'Escócia'      AND team_b = 'Marrocos')      OR (team_a = 'Marrocos'      AND team_b = 'Escócia');

UPDATE matches SET match_date = '2026-06-20T00:30:00+00:00', venue = 'Lincoln Financial Field - Philadelphia', group_name = 'C', round_number = 2
WHERE (team_a = 'Brasil'       AND team_b = 'Haiti')         OR (team_a = 'Haiti'         AND team_b = 'Brasil');

-- 20 de junho
UPDATE matches SET match_date = '2026-06-20T03:00:00+00:00', venue = 'Levi''s Stadium - San Francisco',        group_name = 'D', round_number = 2
WHERE (team_a = 'Turquia'      AND team_b = 'Paraguai')      OR (team_a = 'Paraguai'      AND team_b = 'Turquia');

UPDATE matches SET match_date = '2026-06-20T17:00:00+00:00', venue = 'NRG Stadium - Houston',                  group_name = 'F', round_number = 2
WHERE (team_a = 'Holanda'      AND team_b = 'Suécia')        OR (team_a = 'Suécia'        AND team_b = 'Holanda');

UPDATE matches SET match_date = '2026-06-20T20:00:00+00:00', venue = 'BMO Field - Toronto',                    group_name = 'E', round_number = 2
WHERE (team_a = 'Alemanha'     AND team_b = 'Costa do Marfim') OR (team_a = 'Costa do Marfim' AND team_b = 'Alemanha');

UPDATE matches SET match_date = '2026-06-21T00:00:00+00:00', venue = 'Arrowhead Stadium - Kansas City',        group_name = 'E', round_number = 2
WHERE (team_a = 'Equador'      AND team_b = 'Curaçao')       OR (team_a = 'Curaçao'       AND team_b = 'Equador');

-- 21 de junho
UPDATE matches SET match_date = '2026-06-21T04:00:00+00:00', venue = 'Estadio BBVA - Monterrey',               group_name = 'F', round_number = 2
WHERE (team_a = 'Tunísia'      AND team_b = 'Japão')         OR (team_a = 'Japão'         AND team_b = 'Tunísia');

UPDATE matches SET match_date = '2026-06-21T16:00:00+00:00', venue = 'Mercedes-Benz Stadium - Atlanta',        group_name = 'H', round_number = 2
WHERE (team_a = 'Espanha'      AND team_b = 'Arábia Saudita') OR (team_a = 'Arábia Saudita' AND team_b = 'Espanha');

UPDATE matches SET match_date = '2026-06-21T19:00:00+00:00', venue = 'SoFi Stadium - Los Angeles',             group_name = 'G', round_number = 2
WHERE (team_a = 'Bélgica'      AND team_b = 'Irã')           OR (team_a = 'Irã'           AND team_b = 'Bélgica');

UPDATE matches SET match_date = '2026-06-21T22:00:00+00:00', venue = 'Hard Rock Stadium - Miami',              group_name = 'H', round_number = 2
WHERE (team_a = 'Uruguai'      AND team_b = 'Cabo Verde')    OR (team_a = 'Cabo Verde'    AND team_b = 'Uruguai');

UPDATE matches SET match_date = '2026-06-22T01:00:00+00:00', venue = 'BC Place - Vancouver',                   group_name = 'G', round_number = 2
WHERE (team_a = 'Nova Zelândia' AND team_b = 'Egito')        OR (team_a = 'Egito'         AND team_b = 'Nova Zelândia');

-- 22 de junho
UPDATE matches SET match_date = '2026-06-22T17:00:00+00:00', venue = 'AT&T Stadium - Dallas',                  group_name = 'J', round_number = 2
WHERE (team_a = 'Argentina'    AND team_b = 'Áustria')       OR (team_a = 'Áustria'       AND team_b = 'Argentina');

UPDATE matches SET match_date = '2026-06-22T21:00:00+00:00', venue = 'Lincoln Financial Field - Philadelphia', group_name = 'I', round_number = 2
WHERE (team_a = 'França'       AND team_b = 'Iraque')        OR (team_a = 'Iraque'        AND team_b = 'França');

UPDATE matches SET match_date = '2026-06-23T00:00:00+00:00', venue = 'MetLife Stadium - Nova York',            group_name = 'I', round_number = 2
WHERE (team_a = 'Noruega'      AND team_b = 'Senegal')       OR (team_a = 'Senegal'       AND team_b = 'Noruega');

-- 23 de junho
UPDATE matches SET match_date = '2026-06-23T03:00:00+00:00', venue = 'Levi''s Stadium - San Francisco',        group_name = 'J', round_number = 2
WHERE (team_a = 'Jordânia'     AND team_b = 'Argélia')       OR (team_a = 'Argélia'       AND team_b = 'Jordânia');

UPDATE matches SET match_date = '2026-06-23T17:00:00+00:00', venue = 'NRG Stadium - Houston',                  group_name = 'K', round_number = 2
WHERE (team_a = 'Portugal'     AND team_b = 'Uzbequistão')   OR (team_a = 'Uzbequistão'   AND team_b = 'Portugal');

UPDATE matches SET match_date = '2026-06-23T20:00:00+00:00', venue = 'Gillette Stadium - Boston',              group_name = 'L', round_number = 2
WHERE (team_a = 'Inglaterra'   AND team_b = 'Gana')          OR (team_a = 'Gana'          AND team_b = 'Inglaterra');

UPDATE matches SET match_date = '2026-06-23T23:00:00+00:00', venue = 'BMO Field - Toronto',                    group_name = 'L', round_number = 2
WHERE (team_a = 'Panamá'       AND team_b = 'Croácia')       OR (team_a = 'Croácia'       AND team_b = 'Panamá');

UPDATE matches SET match_date = '2026-06-24T02:00:00+00:00', venue = 'Estadio Akron - Guadalajara',            group_name = 'K', round_number = 2
WHERE (team_a = 'Colômbia'     AND team_b = 'RD Congo')      OR (team_a = 'RD Congo'      AND team_b = 'Colômbia');

-- ============================================================
-- RODADA 3 — 24 a 27 de junho de 2026
-- (jogos simultâneos dentro de cada grupo)
-- ============================================================

-- 24 de junho — Grupo B e C
UPDATE matches SET match_date = '2026-06-24T19:00:00+00:00', venue = 'BC Place - Vancouver',                   group_name = 'B', round_number = 3
WHERE (team_a = 'Suíça'        AND team_b = 'Canadá')        OR (team_a = 'Canadá'        AND team_b = 'Suíça');

UPDATE matches SET match_date = '2026-06-24T19:00:00+00:00', venue = 'Lumen Field - Seattle',                  group_name = 'B', round_number = 3
WHERE (team_a = 'Bósnia'       AND team_b = 'Catar')         OR (team_a = 'Catar'         AND team_b = 'Bósnia');

UPDATE matches SET match_date = '2026-06-24T22:00:00+00:00', venue = 'Hard Rock Stadium - Miami',              group_name = 'C', round_number = 3
WHERE (team_a = 'Escócia'      AND team_b = 'Brasil')        OR (team_a = 'Brasil'        AND team_b = 'Escócia');

UPDATE matches SET match_date = '2026-06-24T22:00:00+00:00', venue = 'Mercedes-Benz Stadium - Atlanta',        group_name = 'C', round_number = 3
WHERE (team_a = 'Marrocos'     AND team_b = 'Haiti')         OR (team_a = 'Haiti'         AND team_b = 'Marrocos');

-- 24→25 de junho — Grupo A
UPDATE matches SET match_date = '2026-06-25T01:00:00+00:00', venue = 'Estadio Azteca - Cidade do México',      group_name = 'A', round_number = 3
WHERE (team_a = 'Tchéquia'     AND team_b = 'México')        OR (team_a = 'México'        AND team_b = 'Tchéquia');

UPDATE matches SET match_date = '2026-06-25T01:00:00+00:00', venue = 'Estadio BBVA - Monterrey',               group_name = 'A', round_number = 3
WHERE (team_a = 'África do Sul' AND team_b = 'Coreia do Sul') OR (team_a = 'Coreia do Sul' AND team_b = 'África do Sul');

-- 25 de junho — Grupo E e F
UPDATE matches SET match_date = '2026-06-25T20:00:00+00:00', venue = 'Lincoln Financial Field - Philadelphia', group_name = 'E', round_number = 3
WHERE (team_a = 'Curaçao'      AND team_b = 'Costa do Marfim') OR (team_a = 'Costa do Marfim' AND team_b = 'Curaçao');

UPDATE matches SET match_date = '2026-06-25T20:00:00+00:00', venue = 'MetLife Stadium - Nova York',            group_name = 'E', round_number = 3
WHERE (team_a = 'Equador'      AND team_b = 'Alemanha')      OR (team_a = 'Alemanha'      AND team_b = 'Equador');

UPDATE matches SET match_date = '2026-06-25T23:00:00+00:00', venue = 'AT&T Stadium - Dallas',                  group_name = 'F', round_number = 3
WHERE (team_a = 'Japão'        AND team_b = 'Suécia')        OR (team_a = 'Suécia'        AND team_b = 'Japão');

UPDATE matches SET match_date = '2026-06-25T23:00:00+00:00', venue = 'Arrowhead Stadium - Kansas City',        group_name = 'F', round_number = 3
WHERE (team_a = 'Tunísia'      AND team_b = 'Holanda')       OR (team_a = 'Holanda'       AND team_b = 'Tunísia');

-- 25→26 de junho — Grupo D
UPDATE matches SET match_date = '2026-06-26T02:00:00+00:00', venue = 'SoFi Stadium - Los Angeles',             group_name = 'D', round_number = 3
WHERE (team_a = 'Turquia'      AND team_b = 'Estados Unidos') OR (team_a = 'Estados Unidos' AND team_b = 'Turquia');

UPDATE matches SET match_date = '2026-06-26T02:00:00+00:00', venue = 'Levi''s Stadium - San Francisco',        group_name = 'D', round_number = 3
WHERE (team_a = 'Paraguai'     AND team_b = 'Austrália')     OR (team_a = 'Austrália'     AND team_b = 'Paraguai');

-- 26 de junho — Grupo I e H
UPDATE matches SET match_date = '2026-06-26T19:00:00+00:00', venue = 'Gillette Stadium - Boston',              group_name = 'I', round_number = 3
WHERE (team_a = 'Noruega'      AND team_b = 'França')        OR (team_a = 'França'        AND team_b = 'Noruega');

UPDATE matches SET match_date = '2026-06-26T19:00:00+00:00', venue = 'BMO Field - Toronto',                    group_name = 'I', round_number = 3
WHERE (team_a = 'Senegal'      AND team_b = 'Iraque')        OR (team_a = 'Iraque'        AND team_b = 'Senegal');

UPDATE matches SET match_date = '2026-06-27T00:00:00+00:00', venue = 'NRG Stadium - Houston',                  group_name = 'H', round_number = 3
WHERE (team_a = 'Cabo Verde'   AND team_b = 'Arábia Saudita') OR (team_a = 'Arábia Saudita' AND team_b = 'Cabo Verde');

UPDATE matches SET match_date = '2026-06-27T00:00:00+00:00', venue = 'Estadio Akron - Guadalajara',            group_name = 'H', round_number = 3
WHERE (team_a = 'Uruguai'      AND team_b = 'Espanha')       OR (team_a = 'Espanha'       AND team_b = 'Uruguai');

-- 27 de junho — Grupo G, L, K e J
UPDATE matches SET match_date = '2026-06-27T03:00:00+00:00', venue = 'Lumen Field - Seattle',                  group_name = 'G', round_number = 3
WHERE (team_a = 'Egito'        AND team_b = 'Irã')           OR (team_a = 'Irã'           AND team_b = 'Egito');

UPDATE matches SET match_date = '2026-06-27T03:00:00+00:00', venue = 'BC Place - Vancouver',                   group_name = 'G', round_number = 3
WHERE (team_a = 'Nova Zelândia' AND team_b = 'Bélgica')      OR (team_a = 'Bélgica'       AND team_b = 'Nova Zelândia');

UPDATE matches SET match_date = '2026-06-27T21:00:00+00:00', venue = 'MetLife Stadium - Nova York',            group_name = 'L', round_number = 3
WHERE (team_a = 'Panamá'       AND team_b = 'Inglaterra')    OR (team_a = 'Inglaterra'    AND team_b = 'Panamá');

UPDATE matches SET match_date = '2026-06-27T21:00:00+00:00', venue = 'Lincoln Financial Field - Philadelphia', group_name = 'L', round_number = 3
WHERE (team_a = 'Croácia'      AND team_b = 'Gana')          OR (team_a = 'Gana'          AND team_b = 'Croácia');

UPDATE matches SET match_date = '2026-06-27T23:30:00+00:00', venue = 'Hard Rock Stadium - Miami',              group_name = 'K', round_number = 3
WHERE (team_a = 'Colômbia'     AND team_b = 'Portugal')      OR (team_a = 'Portugal'      AND team_b = 'Colômbia');

UPDATE matches SET match_date = '2026-06-27T23:30:00+00:00', venue = 'Mercedes-Benz Stadium - Atlanta',        group_name = 'K', round_number = 3
WHERE (team_a = 'RD Congo'     AND team_b = 'Uzbequistão')   OR (team_a = 'Uzbequistão'   AND team_b = 'RD Congo');

UPDATE matches SET match_date = '2026-06-28T02:00:00+00:00', venue = 'Arrowhead Stadium - Kansas City',        group_name = 'J', round_number = 3
WHERE (team_a = 'Argélia'      AND team_b = 'Áustria')       OR (team_a = 'Áustria'       AND team_b = 'Argélia');

UPDATE matches SET match_date = '2026-06-28T02:00:00+00:00', venue = 'AT&T Stadium - Dallas',                  group_name = 'J', round_number = 3
WHERE (team_a = 'Jordânia'     AND team_b = 'Argentina')     OR (team_a = 'Argentina'     AND team_b = 'Jordânia');
