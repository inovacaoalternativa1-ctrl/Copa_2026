import supabase from './supabase';

// ===== MATCHES =====
export const getMatches = () => supabase.from('matches').select('*').order('is_finished').order('match_date');
export const getMatch = (id) => supabase.from('matches').select('*').eq('id', id).single();

// ===== SCORE PREDICTIONS =====
export const getScorePredictions = (matchId, userId) =>
  supabase.from('score_predictions').select('*').eq('match_id', matchId).eq('user_id', userId).single();

export const getUserAllScorePredictions = (userId) =>
  supabase.from('score_predictions').select('match_id, predicted_score_a, predicted_score_b').eq('user_id', userId);

export const upsertScorePrediction = (userId, matchId, scoreA, scoreB) =>
  supabase.from('score_predictions').upsert(
    { user_id: userId, match_id: matchId, predicted_score_a: scoreA, predicted_score_b: scoreB, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,match_id' }
  );

// ===== EXTRA TYPES =====
export const getExtraTypes = (phase = 'groups') => {
  const field = `applicable_in_${['round_of_32', 'round_of_16', 'quarterfinals', 'semifinals'].includes(phase) ? 'knockout' : phase}`;
  return supabase.from('extra_prediction_types').select('*').eq('is_active', true).eq(field, true).order('base_points');
};

// ===== EXTRA PREDICTIONS =====
export const getExtraPredictions = (matchId, userId) =>
  supabase.from('extra_predictions').select('*').eq('match_id', matchId).eq('user_id', userId);

export const upsertExtraPrediction = (userId, matchId, extraTypeId, answer) =>
  supabase.from('extra_predictions').upsert(
    { user_id: userId, match_id: matchId, extra_type_id: extraTypeId, predicted_answer: answer, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,match_id,extra_type_id' }
  );

export const deleteExtraPrediction = (userId, matchId, extraTypeId) =>
  supabase.from('extra_predictions').delete().eq('user_id', userId).eq('match_id', matchId).eq('extra_type_id', extraTypeId);

// ===== ADMIN – VER PALPITES DE UM JOGO =====
export const adminGetMatchScorePredictions = (matchId) =>
  supabase.from('score_predictions')
    .select('*')
    .eq('match_id', matchId)
    .order('points_earned', { ascending: false, nullsFirst: false });

export const adminGetMatchExtraPredictions = (matchId) =>
  supabase.from('extra_predictions')
    .select('*')
    .eq('match_id', matchId);

// ===== RANKING =====
export const getRanking = () => supabase.from('ranking').select('*').order('position');
export const getRoundRanking = (round) =>
  supabase.from('ranking_by_round').select('*').eq('round_number', round).order('position').limit(100);
export const getPhaseRanking = (phase) =>
  supabase.from('ranking_by_phase').select('*').eq('phase', phase).order('position').limit(100);

// ===== ADMIN ANDREY: PONTOS BÔNUS =====
export const adminGiveBonusPoints = (userId, amount) =>
  supabase.rpc('add_bonus_points', { p_user_id: userId, p_amount: amount });

// ===== PALPITE DA SORTE (Brasil x Japão) =====
export const getMyLuckyPrediction = (userId) =>
  supabase.from('lucky_predictions').select('*').eq('user_id', userId).maybeSingle();

export const upsertLuckyPrediction = (payload) =>
  supabase.from('lucky_predictions').upsert(payload, { onConflict: 'user_id' });

export const getLuckyRanking = () =>
  supabase.from('lucky_ranking').select('*').order('position');

export const getLuckyResult = () =>
  supabase.from('lucky_result').select('*').eq('id', 1).maybeSingle();

export const setLuckyResult = (payload) =>
  supabase.rpc('set_lucky_result', {
    p_score_a: payload.scoreA,
    p_score_b: payload.scoreB,
    p_first_team: payload.firstTeam,
    p_scorer_name: payload.scorerName,
    p_penalty: payload.penalty,
    p_red_card: payload.redCard,
    p_yellow_card: payload.yellowCard,
    p_yellow_team: payload.yellowTeam,
    p_is_finished: payload.isFinished,
    p_first_half_goal: payload.firstHalfGoal,
    p_second_half_goal: payload.secondHalfGoal,
    p_both_score: payload.bothScore,
    p_own_goal: payload.ownGoal,
    p_extra_time: payload.extraTime,
    p_penalty_shootout: payload.penaltyShootout,
  });

// ===== CHAT =====
export const getChatMessages = () => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  return supabase
    .from('chat_messages')
    .select('*')
    .or('is_moderated.eq.false,is_moderated.is.null')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(100);
};

export const sendChatMessage = (userId, username, message) =>
  supabase.from('chat_messages').insert({ user_id: userId, username, message, is_moderated: false });

export const subscribeToChat = (callback) =>
  supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, callback).subscribe();

// ===== SPONSORS =====
export const getSponsors = () => supabase.from('sponsors').select('*').eq('is_active', true).order('order_index');

// ===== PROMOTIONS =====
export const getPromotions = () => supabase.from('promotions').select('*').eq('is_active', true);

// ===== ADMIN =====
export const adminGetAllTypes = () => supabase.from('extra_prediction_types').select('*').order('id');
export const adminUpdateType = (id, data) => supabase.from('extra_prediction_types').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
export const adminCreateType = (data) => supabase.from('extra_prediction_types').insert(data).select().single();
export const adminUpdateMatch = (id, data) => supabase.from('matches').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
export const adminCreateMatch = (data) => supabase.from('matches').insert(data).select().single();
export const adminGetUsers = () => supabase.from('profiles').select('*').order('created_at', { ascending: false });
export const adminGetSponsors = () => supabase.from('sponsors').select('*').order('order_index');
export const adminUpsertSponsor = (data) => supabase.from('sponsors').upsert(data);
export const adminDeleteSponsor = (id) => supabase.from('sponsors').delete().eq('id', id);
export const adminGetPromotions = () => supabase.from('promotions').select('*').order('created_at', { ascending: false });
export const adminUpsertPromotion = (data) => supabase.from('promotions').upsert(data);
export const adminModerateChat = (id) => supabase.from('chat_messages').update({ is_moderated: true }).eq('id', id);

// ===== QUIZ =====
export const getTodayQuiz = () =>
  supabase.from('quiz_questions')
    .select('id, quiz_date, question_text, options, explanation')
    .eq('quiz_date', new Date().toISOString().split('T')[0])
    .maybeSingle();

export const getUserQuizAnswer = (questionId) =>
  supabase.from('quiz_answers')
    .select('selected_option_index, is_correct, correct_option_index')
    .eq('question_id', questionId)
    .maybeSingle();

export const submitQuizAnswer = (questionId, selectedIndex) =>
  supabase.rpc('submit_quiz_answer', { p_question_id: questionId, p_selected_index: selectedIndex });

// ===== NEWS / POSTS =====
export const getPosts = () =>
  supabase.from('posts')
    .select('*, profiles!author_id(username, avatar_url)')
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

export const getPostLikes = (postIds) =>
  supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds);

export const getPostComments = (postId) =>
  supabase.from('post_comments')
    .select('*, profiles!user_id(avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

export const addPostLike = (userId, postId) =>
  supabase.from('post_likes').upsert(
    { user_id: userId, post_id: postId },
    { onConflict: 'user_id,post_id', ignoreDuplicates: true }
  );

export const removePostLike = (userId, postId) =>
  supabase.from('post_likes').delete().eq('user_id', userId).eq('post_id', postId);

export const addPostComment = (userId, username, postId, content) =>
  supabase.from('post_comments').insert({ user_id: userId, username, post_id: postId, content }).select().single();

export const deletePostComment = (commentId) =>
  supabase.from('post_comments').delete().eq('id', commentId);

export const adminGetAllPosts = () =>
  supabase.from('posts')
    .select('*, profiles!author_id(username, avatar_url)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

export const adminCreatePost = (data) =>
  supabase.from('posts').insert(data).select().single();

export const adminUpdatePost = (id, data) =>
  supabase.from('posts').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);

export const adminDeletePost = (id) =>
  supabase.from('posts').delete().eq('id', id);

export const adminGetExtraResults = (matchId) =>
  supabase.from('extra_results').select('*').eq('match_id', matchId);

export const adminSetMatchResult = async (matchId, scoreA, scoreB) => {
  return supabase.from('matches').update({
    score_a: scoreA, score_b: scoreB,
    is_finished: true, is_locked: true,
  }).eq('id', matchId);
};

export const adminValidateExtra = async (matchId, extraTypeId, result, adminId) => {
  return supabase.from('extra_results').upsert(
    { match_id: matchId, extra_type_id: extraTypeId, official_result: result,
      is_validated: true, validated_at: new Date().toISOString(), validated_by: adminId },
    { onConflict: 'match_id,extra_type_id' }
  );
};
