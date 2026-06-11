import React, { useState, useEffect, useRef } from 'react';
import { getChatMessages, sendChatMessage, subscribeToChat } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../services/supabase';
import './ChatPage.css';

const EMOJIS = [
  // Futebol & Copa do Mundo
  '⚽','🥅','🏆','🥇','🥈','🥉','🏅','🎖️','🎯','📺',
  // Comemorações
  '🎉','🎊','🎈','🎆','🎇','🥳','🍾','🥂','🎀','🎁',
  // Feliz / Animado
  '😀','😃','😄','😁','😆','😂','🤣','😊','🥰','😍',
  '🤩','😘','😋','😛','😜','🤪','😝','🤑','🤗','😎',
  // Surpresa / Reação
  '😱','🤯','😮','😲','😳','🤭','🤔','🙄','😐','😶',
  // Triste / Nervoso
  '😭','😢','🥺','😩','😫','😔','😟','😕','🙁','☹️',
  // Raiva / Frustração
  '😤','😠','😡','🤬','😈','👿','💀','☠️','😣','😖',
  // Ansioso / Desconfortável
  '😅','😬','😰','😨','😧','😦','😴','🤤','😵','🥴',
  // Gestos & Mãos
  '👍','👎','👏','🙌','💪','✊','✌️','🤞','🙏','🤝',
  '👋','🤙','☝️','👆','👉','👈','🖐️','✋','👌','🤛',
  // Corações
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💕',
  // Símbolos & Fogo
  '🔥','⚡','💥','⭐','🌟','💫','✨','👑','💎','💯',
  // Outros rostos
  '😏','😒','😑','🤓','🧐','🤠','🎃','👻','👾','🤡',
  // Mundial
  '🌎','🌍','🌏','🚀','📣','📢','🏟️','🌈','🎵','🎮',
  // Seleções Copa 2026 – Sul-América
  '🇦🇷','🇧🇷','🇺🇾','🇨🇴','🇪🇨','🇵🇾','🇻🇪',
  // Seleções Copa 2026 – América do Norte & Central
  '🇺🇸','🇨🇦','🇲🇽','🇵🇦','🇨🇷','🇯🇲','🇭🇳',
  // Seleções Copa 2026 – Europa
  '🇩🇪','🇫🇷','🇪🇸','🇵🇹','🇬🇧','🇳🇱','🇧🇪','🇨🇭',
  '🇦🇹','🇭🇷','🇩🇰','🇹🇷','🇷🇴','🇸🇰','🇮🇹','🇷🇸',
  // Seleções Copa 2026 – África
  '🇲🇦','🇸🇳','🇳🇬','🇪🇬','🇨🇮','🇨🇲','🇿🇦','🇹🇳','🇩🇿',
  // Seleções Copa 2026 – Ásia & Oceânia
  '🇯🇵','🇰🇷','🇸🇦','🇮🇷','🇦🇺','🇨🇳','🇯🇴','🇮🇶','🇳🇿',
];

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = [
  '#004aad','#1a6bcc','#e05c00','#9c27b0',
  '#009c3b','#c62828','#00838f','#5c6bc0',
  '#d84315','#2e7d32','#6a1b9a','#0277bd',
];
const avatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const flagUrl = flag => {
  if (!flag) return null;
  const pts = [...flag].map(c => c.codePointAt(0));
  if (pts[0] >= 0x1F1E6 && pts[0] <= 0x1F1FF) {
    const iso = String.fromCharCode(pts[0] - 0x1F1E6 + 65) + String.fromCharCode(pts[1] - 0x1F1E6 + 65);
    return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
  }
  if (pts[0] === 0x1F3F4) {
    const code = pts.slice(1)
      .filter(p => p >= 0xE0061 && p <= 0xE007A)
      .map(p => String.fromCharCode(p - 0xE0000))
      .join('');
    return `https://flagcdn.com/w40/${code.slice(0, 2)}-${code.slice(2)}.png`;
  }
  if (/^[A-Za-z]{2}$/.test(flag)) return `https://flagcdn.com/w40/${flag.toLowerCase()}.png`;
  return null;
};

const fmtMatchDate = d =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const calcCountdown = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

// ── Figurinhas ───────────────────────────────────────────────
const STICKERS = [
  { key: 'mascote',      label: '🕺 Homem festejando'   },
  { key: 'menina_festa', label: '💃 Menina festejando'  },
  { key: 'gol_menino',   label: '🙌 Gol! Menino'        },
  { key: 'gol_menina1',  label: '🙌 Gol! Menina'        },
  { key: 'gol_menina2',  label: '🙌 Gol! Menina 2'      },
  { key: 'triste_homem', label: '😭 Homem chorando'     },
  { key: 'triste_menina',label: '😭 Menina chorando'    },
];
const STICKER_PATH = (key) => `/stickers/${key}.png`;
const isSticker = (msg) => /^\[sticker:[a-z0-9_]+\]$/.test(msg?.trim());
const stickerKey = (msg) => msg?.trim().match(/^\[sticker:([a-z0-9_]+)\]$/)?.[1];
// ─────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState('');
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [sendError, setSendError]     = useState('');
  const [showEmojis, setShowEmojis]   = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [avatarViewer, setAvatarViewer] = useState({ open: false, src: null, name: '', color: '' });
  const [liveMatches, setLiveMatches] = useState([]);
  const [nextMatch, setNextMatch]     = useState(null);
  const [countdown, setCountdown]     = useState('');
  const bottomRef      = useRef(null);
  const emojiRef       = useRef(null);
  const inputRef       = useRef(null);
  const prevUsernameRef = useRef(null);
  const avatarsCacheRef = useRef({});
  const [userAvatars, setUserAvatars] = useState({});

  // ── Carregar mensagens + realtime ────────────────────────────────────────
  const CACHE_KEY = 'copa_chat_cache';
  const CUTOFF_MS = 24 * 60 * 60 * 1000;

  const applyMessages = (msgs) => {
    setMessages(msgs);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(msgs)); } catch (_) {}
  };

  const loadAvatars = async (msgs) => {
    const newIds = [...new Set(msgs.map(m => m.user_id))]
      .filter(id => !(id in avatarsCacheRef.current));
    if (!newIds.length) return;
    newIds.forEach(id => { avatarsCacheRef.current[id] = null; });
    const { data } = await supabase.from('profiles').select('id, avatar_url').in('id', newIds);
    if (!data?.length) return;
    const updates = {};
    data.forEach(p => { updates[p.id] = p.avatar_url || null; });
    avatarsCacheRef.current = { ...avatarsCacheRef.current, ...updates };
    setUserAvatars(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    // Exibe cache do localStorage imediatamente (persiste entre sessões, até 24h)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cutoff = Date.now() - CUTOFF_MS;
        const msgs = JSON.parse(cached).filter(m => new Date(m.created_at).getTime() > cutoff);
        if (msgs.length > 0) { applyMessages(msgs); loadAvatars(msgs); setLoading(false); }
      }
    } catch (_) {}

    const loadMessages = async () => {
      const { data, error } = await getChatMessages();
      if (error) { console.error('[Chat] Erro SELECT:', error.message); setLoading(false); return; }
      const msgs = (data || []).reverse();
      if (msgs.length > 0) {
        applyMessages(msgs);
        loadAvatars(msgs);
      } else {
        // Só limpa o cache se não houver mensagens válidas salvas localmente
        const cutoff = Date.now() - CUTOFF_MS;
        try {
          const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
          if (saved.filter(m => new Date(m.created_at).getTime() > cutoff).length === 0) {
            applyMessages([]);
          }
        } catch (_) { applyMessages([]); }
      }
      setLoading(false);
    };

    loadMessages();

    const channel = subscribeToChat(async payload => {
      if (!payload.new.is_moderated) {
        const msg = payload.new;
        setMessages(prev => {
          const updated = [...prev, msg];
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch (_) {}
          return updated;
        });
        if (!(msg.user_id in avatarsCacheRef.current)) {
          avatarsCacheRef.current[msg.user_id] = null;
          const { data } = await supabase.from('profiles').select('avatar_url').eq('id', msg.user_id).single();
          const url = data?.avatar_url || null;
          avatarsCacheRef.current[msg.user_id] = url;
          setUserAvatars(prev => ({ ...prev, [msg.user_id]: url }));
        }
      }
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadMessages();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Sincroniza avatar do usuário logado quando ele atualiza a foto
  useEffect(() => {
    if (!user?.id) return;
    const url = profile?.avatar_url || null;
    avatarsCacheRef.current[user.id] = url;
    setUserAvatars(prev => ({ ...prev, [user.id]: url }));
  }, [user?.id, profile?.avatar_url]);

  // Re-busca mensagens quando o username muda (para refletir o novo nome nas mensagens anteriores)
  useEffect(() => {
    if (!profile?.username) return;
    if (prevUsernameRef.current === null) { prevUsernameRef.current = profile.username; return; }
    if (prevUsernameRef.current === profile.username) return;
    prevUsernameRef.current = profile.username;
    getChatMessages().then(({ data }) => {
      const msgs = (data || []).reverse();
      applyMessages(msgs);
      loadAvatars(msgs);
    });
  }, [profile?.username]);

  // ── Fechar painéis ao clicar fora ───────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojis(false);
        setShowStickers(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Jogos ao vivo ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const now = new Date().toISOString();
      const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('matches')
        .select('id, team_a, team_b, team_a_flag, team_b_flag, score_a, score_b')
        .eq('is_finished', false)
        .gte('match_date', cutoff)
        .lte('match_date', now);
      setLiveMatches(data || []);
    };
    fetch();
    const t = setInterval(fetch, 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Próximo jogo ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('matches')
        .select('id, team_a, team_b, team_a_flag, team_b_flag, match_date')
        .eq('is_locked', false)
        .eq('is_finished', false)
        .order('match_date')
        .limit(1);
      setNextMatch(data?.[0] || null);
    };
    fetch();
    const t = setInterval(fetch, 60_000);
    return () => clearInterval(t);
  }, []);

  // ── Tick countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!nextMatch) return;
    const tick = () => setCountdown(calcCountdown(nextMatch.match_date));
    tick();
    const t = setInterval(tick, 1_000);
    return () => clearInterval(t);
  }, [nextMatch]);

  // ── Ler texto do campo (contentEditable) ────────────────────────────────
  const getInputText = () => {
    if (!inputRef.current) return '';
    let result = '';
    inputRef.current.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) result += node.textContent;
      else if (node.nodeName === 'IMG') result += node.alt || '';
      else result += node.textContent || '';
    });
    return result;
  };

  // ── Enviar mensagem ──────────────────────────────────────────────────────
  const handleSend = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const message = getInputText().trim();
    if (!message || sending) return;
    setSending(true);
    setSendError('');
    const { error } = await sendChatMessage(user.id, profile.username, message);
    if (error) {
      console.error('[Chat] Erro INSERT:', error.message);
      setSendError('Erro ao enviar. Tente novamente.');
    } else {
      inputRef.current.innerHTML = '';
      setText('');
    }
    setSending(false);
  };

  // ── Enviar figurinha ─────────────────────────────────────────────────────
  const sendSticker = async (key) => {
    setShowStickers(false);
    if (sending) return;
    setSending(true);
    setSendError('');
    const { error } = await sendChatMessage(user.id, profile.username, `[sticker:${key}]`);
    if (error) setSendError('Erro ao enviar. Tente novamente.');
    setSending(false);
  };

  const insertEmoji = (emoji) => {
    setShowEmojis(false);
    inputRef.current?.focus();
    const url = flagUrl(emoji);
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = emoji;
      img.style.cssText = 'width:20px;height:15px;object-fit:contain;border-radius:2px;vertical-align:middle;margin:0 2px';
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        inputRef.current.appendChild(img);
      }
    } else {
      document.execCommand('insertText', false, emoji);
    }
    setText(getInputText());
  };

  const fmtTime = d => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const renderMessage = (text) => {
    const regex = /[\u{1F1E6}-\u{1F1FF}][\u{1F1E6}-\u{1F1FF}]/gu;
    const parts = [];
    let last = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index));
      const url = flagUrl(match[0]);
      parts.push(url
        ? <img key={match.index} src={url} alt={match[0]} style={{width:20,height:15,objectFit:'contain',borderRadius:2,verticalAlign:'middle',margin:'0 1px'}} />
        : match[0]);
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length ? parts : text;
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="chat-page">
      <div className="page-header">
        <h1 className="page-title">💬 Chat ao Vivo</h1>
        <span className="badge badge-live">🔴 Ao vivo</span>
      </div>

      {/* Banner: jogo ao vivo */}
      {liveMatches.length > 0 && (
        <div className="live-banner">
          {liveMatches.map(m => (
            <div key={m.id} className="live-banner-match">
              <span className="live-dot">🔴</span>
              <span className="live-label">AO VIVO</span>
              <div className="live-match-teams">
                {flagUrl(m.team_a_flag)
                  ? <img className="live-flag" src={flagUrl(m.team_a_flag)} alt={m.team_a} />
                  : <span>{m.team_a_flag}</span>}
                <span className="live-team-name">{m.team_a}</span>
                <span className="live-score">{m.score_a ?? 0} × {m.score_b ?? 0}</span>
                <span className="live-team-name">{m.team_b}</span>
                {flagUrl(m.team_b_flag)
                  ? <img className="live-flag" src={flagUrl(m.team_b_flag)} alt={m.team_b} />
                  : <span>{m.team_b_flag}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner: countdown próximo jogo */}
      {liveMatches.length === 0 && nextMatch && countdown && (
        <div className="next-match-banner">
          <div className="next-match-label">⏱️ PRÓXIMO JOGO</div>
          <div className="next-match-teams">
            <div className="next-match-team">
              {flagUrl(nextMatch.team_a_flag)
                ? <img className="next-flag" src={flagUrl(nextMatch.team_a_flag)} alt={nextMatch.team_a} />
                : <span>{nextMatch.team_a_flag}</span>}
              <span className="next-team-name">{nextMatch.team_a}</span>
            </div>
            <span className="next-vs">VS</span>
            <div className="next-match-team">
              {flagUrl(nextMatch.team_b_flag)
                ? <img className="next-flag" src={flagUrl(nextMatch.team_b_flag)} alt={nextMatch.team_b} />
                : <span>{nextMatch.team_b_flag}</span>}
              <span className="next-team-name">{nextMatch.team_b}</span>
            </div>
          </div>
          <div className="next-match-meta">
            <span className="next-date">📅 {fmtMatchDate(nextMatch.match_date)}</span>
            <span className="next-countdown">{countdown}</span>
          </div>
        </div>
      )}

      <div className="chat-container card">
        <div className="chat-messages">
          {messages.length === 0 && <div className="chat-empty">Seja o primeiro a comentar! 👋</div>}
          {messages.map(m => {
            const isMine = m.user_id === user.id;
            const avatarUrl = userAvatars[m.user_id] || null;
            const hasPhoto = !!avatarUrl;
            const bgColor = hasPhoto ? 'transparent' : avatarColor(m.username);
            return (
              <div key={m.id} className={`chat-msg ${isMine ? 'mine' : ''}`}>
                <div
                  className="chat-avatar"
                  style={{ background: bgColor, padding: 0, cursor: 'pointer' }}
                  onClick={() => setAvatarViewer({ open: true, src: avatarUrl, name: m.username, color: bgColor })}
                  title={`Ver foto de ${m.username}`}
                >
                  {hasPhoto
                    ? <img src={avatarUrl} alt={m.username} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                    : getInitials(m.username)}
                </div>
                <div className="chat-msg-content">
                  <div className="msg-header">
                    <span className="msg-user">{m.username}</span>
                    <span className="msg-time">{fmtTime(m.created_at)}</span>
                  </div>
                  {isSticker(m.message)
                    ? <img
                        src={STICKER_PATH(stickerKey(m.message))}
                        alt="figurinha"
                        className="chat-sticker"
                      />
                    : <div className="msg-bubble">{renderMessage(m.message)}</div>
                  }
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-wrapper" ref={emojiRef}>
          {showEmojis && (
            <div className="emoji-panel">
              {EMOJIS.map(e => {
                const url = flagUrl(e);
                return (
                  <button key={e} type="button" className="emoji-btn" onClick={() => insertEmoji(e)}>
                    {url
                      ? <img src={url} alt={e} style={{width:24,height:18,objectFit:'contain',borderRadius:2}} />
                      : e}
                  </button>
                );
              })}
            </div>
          )}
          {showStickers && (
            <div className="sticker-panel">
              <p className="sticker-panel-title">🎭 Figurinhas</p>
              <div className="sticker-grid">
                {STICKERS.map(s => (
                  <button
                    key={s.key}
                    type="button"
                    className="sticker-thumb"
                    onClick={() => sendSticker(s.key)}
                    title={s.label}
                  >
                    <img src={STICKER_PATH(s.key)} alt={s.label} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <form className="chat-input" onSubmit={handleSend}>
            <button
              type="button"
              className={`emoji-toggle ${showEmojis ? 'active' : ''}`}
              onClick={() => { setShowEmojis(v => !v); setShowStickers(false); }}
              title="Emojis"
            >
              😊
            </button>
            <button
              type="button"
              className={`emoji-toggle ${showStickers ? 'active' : ''}`}
              onClick={() => { setShowStickers(v => !v); setShowEmojis(false); }}
              title="Figurinhas"
            >
              🎭
            </button>
            <div
              ref={inputRef}
              contentEditable
              suppressContentEditableWarning
              className="chat-input-field"
              data-placeholder="Digite sua mensagem..."
              onInput={() => { setText(getInputText()); setSendError(''); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim() || sending}>
              {sending ? '...' : 'Enviar'}
            </button>
          </form>
          {sendError && <p className="chat-send-error">{sendError}</p>}
        </div>
      </div>

      <p className="chat-rules">⚠️ Mensagens somem após 24h · Proibido conteúdo ofensivo ou discriminatório.</p>

      {avatarViewer.open && (
        <div className="avatar-lightbox-overlay" onClick={() => setAvatarViewer({ open: false, src: null, name: '', color: '' })}>
          <div className="avatar-lightbox" onClick={e => e.stopPropagation()}>
            <button className="avatar-lightbox-close" onClick={() => setAvatarViewer({ open: false, src: null, name: '', color: '' })}>✕</button>
            {avatarViewer.src
              ? <img src={avatarViewer.src} alt={avatarViewer.name} className="avatar-lightbox-img" />
              : <div className="avatar-lightbox-initials" style={{ background: avatarViewer.color }}>
                  {getInitials(avatarViewer.name)}
                </div>}
            <p className="avatar-lightbox-name">{avatarViewer.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
