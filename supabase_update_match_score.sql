-- Cole este SQL no Supabase Dashboard → SQL Editor → New query → Run
--
-- Cria uma função RPC que atualiza o placar de um jogo.
-- SECURITY DEFINER faz ela rodar com privilégios internos, bypassando o RLS,
-- mas sem expor a service_role key no frontend.

CREATE OR REPLACE FUNCTION update_match_score(
  p_match_id   INT,
  p_score_a    INT,
  p_score_b    INT,
  p_finished   BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE matches
  SET
    score_a    = p_score_a,
    score_b    = p_score_b,
    is_finished = CASE WHEN p_finished THEN TRUE ELSE is_finished END,
    is_locked   = TRUE
  WHERE id = p_match_id;
END;
$$;

-- Permite que o usuário anônimo (frontend) chame esta função
GRANT EXECUTE ON FUNCTION update_match_score(INT, INT, INT, BOOLEAN) TO anon;
