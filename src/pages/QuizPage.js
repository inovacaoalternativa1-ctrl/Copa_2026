import React, { useState, useEffect } from 'react';
import { getTodayQuiz, getUserQuizAnswer, submitQuizAnswer } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './QuizPage.css';

const QUIZ_END_DATE = '2026-06-11';
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizPage() {
  const { user } = useAuth();
  const [question, setQuestion]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [result, setResult]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  const today = new Date().toISOString().split('T')[0];
  const isEnded = today >= QUIZ_END_DATE;

  useEffect(() => {
    if (!user || isEnded) { setLoading(false); return; }
    const load = async () => {
      const { data: q } = await getTodayQuiz();
      if (!q) { setLoading(false); return; }
      setQuestion(q);
      const { data: ans } = await getUserQuizAnswer(q.id);
      if (ans) {
        setSelected(ans.selected_option_index);
        setResult({ is_correct: ans.is_correct, correct_option_index: ans.correct_option_index });
      }
      setLoading(false);
    };
    load();
  }, [user, isEnded]);

  const handleAnswer = async (idx) => {
    if (result || submitting) return;
    setSubmitting(true);
    setSelected(idx);
    setError('');
    const { data, error: err } = await submitQuizAnswer(question.id, idx);
    if (err) { setError('Erro ao enviar resposta. Tente novamente.'); setSubmitting(false); return; }
    setResult(data);
    setSubmitting(false);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="quiz-page">
      <div className="page-header">
        <h1 className="page-title">🧠 Quiz Copa do Mundo</h1>
        {!isEnded && <span className="badge badge-blue">+0,01 pt por acerto</span>}
      </div>

      {isEnded ? (
        <div className="card quiz-ended-card">
          <div className="quiz-ended-icon">🏆</div>
          <h2>Quiz encerrado!</h2>
          <p>O quiz diário foi encerrado com o início da Copa do Mundo 2026.</p>
          <p>Boa sorte nos palpites dos jogos!</p>
        </div>
      ) : !question ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <p>Nenhuma pergunta disponível para hoje.</p>
        </div>
      ) : (
        <>
          <div className="quiz-info-bar">
            <span className="quiz-info-item">📅 Pergunta de hoje</span>
            <span className="quiz-info-item quiz-info-pts">🏆 Vai para o ranking da 1ª Rodada</span>
          </div>

          <div className="card quiz-card">
            <div className="quiz-question-header">
              <span className="quiz-category-tag">História da Copa</span>
              <span className="quiz-pts-tag">+0,01 pt</span>
            </div>

            <p className="quiz-question-text">{question.question_text}</p>

            <div className="quiz-options">
              {(question.options || []).map((opt, idx) => {
                let cls = 'quiz-opt';
                if (result) {
                  if (idx === result.correct_option_index) cls += ' quiz-opt--correct';
                  else if (idx === selected) cls += ' quiz-opt--wrong';
                } else if (selected === idx && submitting) {
                  cls += ' quiz-opt--loading';
                }
                return (
                  <button
                    key={idx}
                    className={cls}
                    onClick={() => handleAnswer(idx)}
                    disabled={!!result || submitting}
                  >
                    <span className="quiz-opt-letter">{OPTION_LETTERS[idx]}</span>
                    <span className="quiz-opt-text">{opt}</span>
                    {result && idx === result.correct_option_index && (
                      <span className="quiz-opt-badge quiz-opt-badge--correct">✓</span>
                    )}
                    {result && idx === selected && idx !== result.correct_option_index && (
                      <span className="quiz-opt-badge quiz-opt-badge--wrong">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {error && <p className="quiz-error">{error}</p>}

            {result ? (
              <div className={`quiz-result ${result.is_correct ? 'quiz-result--correct' : 'quiz-result--wrong'}`}>
                <span className="quiz-result-icon">{result.is_correct ? '🎉' : '😔'}</span>
                <div>
                  <strong>{result.is_correct ? 'Correto! +0,01 ponto adicionado.' : 'Errou desta vez!'}</strong>
                  {question.explanation && <p className="quiz-explanation">{question.explanation}</p>}
                </div>
              </div>
            ) : (
              <p className="quiz-hint">⚠️ Você só pode responder uma vez. Escolha com cuidado!</p>
            )}

            {result && (
              <p className="quiz-next-msg">📅 Nova pergunta disponível amanhã</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
