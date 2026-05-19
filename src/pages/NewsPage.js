import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../services/supabase';
import {
  getPosts, getPostLikes, getPostComments,
  addPostLike, removePostLike, addPostComment, deletePostComment,
  adminGetAllPosts, adminCreatePost, adminUpdatePost, adminDeletePost,
} from '../services/api';
import './NewsPage.css';

const TAGS = [
  { label: '📰 Notícia',     value: 'Notícia',     color: '#004aad' },
  { label: '📋 Convocação',  value: 'Convocação',  color: '#7c3aed' },
  { label: '⚽ Resultado',   value: 'Resultado',   color: '#009c3b' },
  { label: '💡 Curiosidade', value: 'Curiosidade', color: '#f59e0b' },
  { label: '🚨 Urgente',     value: 'Urgente',     color: '#d92d20' },
];
const TAG_MAP = Object.fromEntries(TAGS.map(t => [t.value, t]));

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'agora';
  if (mins  < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  if (days  === 1) return 'ontem';
  if (days  < 7)  return `${days}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const initials = (name = '') => {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? name.slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const avatarColor = (str = '') => {
  const cols = ['#004aad','#009c3b','#ff7a00','#7c3aed','#d92d20','#0891b2','#c2410c'];
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return cols[Math.abs(h) % cols.length];
};

const EMPTY_FORM = { title: '', content: '', image_url: '', tag: 'Notícia', is_pinned: false, is_published: true };

const isVideoUrl = (url = '') => /\.(mp4|mov|webm|avi|mkv|ogv)(\?|$)/i.test(url);

export default function NewsPage() {
  const { user, profile, isAdmin } = useAuth();

  const [posts,          setPosts]          = useState([]);
  const [likes,          setLikes]          = useState({});
  const [commentCounts,  setCommentCounts]  = useState({});
  const [expandedPosts,  setExpandedPosts]  = useState(new Set());
  const [postComments,   setPostComments]   = useState({});
  const [loadingCmts,    setLoadingCmts]    = useState({});
  const [commentInput,   setCommentInput]   = useState({});
  const [sendingCmt,     setSendingCmt]     = useState({});
  const [loading,        setLoading]        = useState(true);
  const [likeAnim,       setLikeAnim]       = useState({});
  const [newPostToast,   setNewPostToast]   = useState(null);
  const [filter,         setFilter]         = useState('Todos');

  const [showModal,    setShowModal]    = useState(false);
  const [editingPost,  setEditingPost]  = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState('');

  // media upload state
  const [mediaPreview,  setMediaPreview]  = useState(null);
  const [mediaIsVideo,  setMediaIsVideo]  = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadErr,     setUploadErr]     = useState('');
  const [dragOver,      setDragOver]      = useState(false);
  const fileInputRef = useRef(null);

  // ─── Media upload helpers ────────────────────────────────────────────────
  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const MAX = 1400;
      let { width, height } = img;
      if (width > MAX)  { height = Math.round(height * MAX / width); width = MAX; }
      if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', 0.88);
    };
    img.src = objUrl;
  });

  const processFile = async (file) => {
    const isVid = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');
    if (!isVid && !isImg) { setUploadErr('Formato não suportado. Use foto (JPG/PNG) ou vídeo (MP4/MOV).'); return; }
    if (isVid && file.size > 50 * 1024 * 1024) { setUploadErr('Vídeo muito grande. Máximo 50MB.'); return; }
    setUploadErr('');
    setMediaIsVideo(isVid);
    setMediaPreview(URL.createObjectURL(file));
    setUploading(true);
    let toUpload = file;
    let contentType = file.type;
    if (isImg) { toUpload = await compressImage(file); contentType = 'image/jpeg'; }
    const ext  = isVid ? (file.name.split('.').pop() || 'mp4') : 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('post-media').upload(path, toUpload, { contentType, upsert: false });
    if (error) { setUploadErr(`Erro no upload: ${error.message}`); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleFileSelect = (e) => { const f = e.target.files[0]; if (f) processFile(f); };

  const clearMedia = () => {
    setMediaPreview(null); setMediaIsVideo(false); setUploadErr('');
    setForm(f => ({ ...f, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) processFile(f);
  };

  // ─── Load feed ───────────────────────────────────────────────────────────
  const loadFeed = async () => {
    setLoading(true);
    const { data } = isAdmin ? await adminGetAllPosts() : await getPosts();
    if (!data) { setLoading(false); return; }
    setPosts(data);

    if (data.length > 0) {
      const ids = data.map(p => p.id);
      const { data: lk } = await getPostLikes(ids);
      const likesMap = {};
      ids.forEach(id => (likesMap[id] = new Set()));
      lk?.forEach(l => likesMap[l.post_id]?.add(l.user_id));
      setLikes(likesMap);
    }
    setLoading(false);
  };

  useEffect(() => { loadFeed(); }, []); // eslint-disable-line

  // ─── Realtime: likes ─────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel('news-likes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, payload => {
        if (payload.eventType === 'INSERT') {
          setLikes(prev => {
            const s = new Set(prev[payload.new.post_id] || []);
            s.add(payload.new.user_id);
            return { ...prev, [payload.new.post_id]: s };
          });
        } else if (payload.eventType === 'DELETE') {
          setLikes(prev => {
            const s = new Set(prev[payload.old.post_id] || []);
            s.delete(payload.old.user_id);
            return { ...prev, [payload.old.post_id]: s };
          });
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  // ─── Realtime: comments (INSERT only; deletes handled optimistically) ────
  useEffect(() => {
    const ch = supabase.channel('news-comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments' }, async payload => {
        const msg = payload.new;
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', msg.user_id).single();
        const enriched = { ...msg, profiles: { avatar_url: data?.avatar_url || null } };
        setPostComments(prev => {
          if (!(msg.post_id in prev)) return prev;
          const already = prev[msg.post_id].some(c => c.id === msg.id);
          if (already) return prev;
          return { ...prev, [msg.post_id]: [...prev[msg.post_id], enriched] };
        });
        setCommentCounts(prev => ({ ...prev, [msg.post_id]: (prev[msg.post_id] || 0) + 1 }));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  // ─── Realtime: new posts toast ───────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel('news-posts-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async payload => {
        if (!payload.new.is_published) return;
        const { data: authorData } = await supabase
          .from('profiles').select('username, avatar_url').eq('id', payload.new.author_id).single();
        const newPost = { ...payload.new, profiles: authorData };
        setPosts(prev => [newPost, ...prev]);
        setLikes(prev => ({ ...prev, [newPost.id]: new Set() }));
        if (!isAdmin) {
          setNewPostToast(newPost);
          setTimeout(() => setNewPostToast(null), 5000);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [isAdmin]);

  // ─── Like ─────────────────────────────────────────────────────────────────
  const handleLike = async (postId) => {
    if (!user) return;
    const hasLiked = likes[postId]?.has(user.id);

    setLikeAnim(prev => ({ ...prev, [postId]: true }));
    setTimeout(() => setLikeAnim(prev => ({ ...prev, [postId]: false })), 350);

    setLikes(prev => {
      const s = new Set(prev[postId] || []);
      if (hasLiked) s.delete(user.id); else s.add(user.id);
      return { ...prev, [postId]: s };
    });

    if (hasLiked) await removePostLike(user.id, postId);
    else          await addPostLike(user.id, postId);
  };

  // ─── Comments ─────────────────────────────────────────────────────────────
  const toggleComments = async (postId) => {
    const next = new Set(expandedPosts);
    if (next.has(postId)) { next.delete(postId); setExpandedPosts(next); return; }
    next.add(postId);
    setExpandedPosts(next);
    if (postComments[postId]) return;
    setLoadingCmts(prev => ({ ...prev, [postId]: true }));
    const { data } = await getPostComments(postId);
    setPostComments(prev => ({ ...prev, [postId]: data || [] }));
    setCommentCounts(prev => ({ ...prev, [postId]: (data || []).length }));
    setLoadingCmts(prev => ({ ...prev, [postId]: false }));
  };

  const handleComment = async (postId) => {
    const content = (commentInput[postId] || '').trim();
    if (!content || !user) return;
    setSendingCmt(prev => ({ ...prev, [postId]: true }));
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
    await addPostComment(user.id, profile?.username || 'Usuário', postId, content);
    setSendingCmt(prev => ({ ...prev, [postId]: false }));
  };

  const handleDeleteComment = async (postId, commentId) => {
    setPostComments(prev => ({
      ...prev, [postId]: (prev[postId] || []).filter(c => c.id !== commentId),
    }));
    setCommentCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 1) - 1) }));
    await deletePostComment(commentId);
  };

  // ─── Admin CRUD ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingPost(null); setForm(EMPTY_FORM); setFormError('');
    setMediaPreview(null); setMediaIsVideo(false); setUploadErr('');
    setShowModal(true);
  };
  const openEdit = (post) => {
    setEditingPost(post);
    setForm({ title: post.title, content: post.content, image_url: post.image_url || '',
              tag: post.tag || 'Notícia', is_pinned: !!post.is_pinned, is_published: post.is_published });
    setFormError('');
    setMediaPreview(post.image_url || null);
    setMediaIsVideo(isVideoUrl(post.image_url || ''));
    setUploadErr('');
    setShowModal(true);
  };
  const handleSubmitPost = async () => {
    if (!form.title.trim())   { setFormError('Título é obrigatório.'); return; }
    if (!form.content.trim()) { setFormError('Conteúdo é obrigatório.'); return; }
    setSubmitting(true); setFormError('');
    if (editingPost) await adminUpdatePost(editingPost.id, { ...form, author_id: user.id });
    else             await adminCreatePost({ ...form, author_id: user.id });
    setShowModal(false);
    setSubmitting(false);
    if (editingPost) await loadFeed();
  };
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Excluir este post permanentemente?')) return;
    await adminDeletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filtered = filter === 'Todos' ? posts : posts.filter(p => p.tag === filter);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return <div className="news-loading"><div className="spinner" /></div>;

  return (
    <div className="news-page">

      {/* Toast: nova publicação */}
      {newPostToast && (
        <div className="news-toast">
          <span>🔔 Nova publicação: <strong>{newPostToast.title}</strong></span>
          <button onClick={() => setNewPostToast(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="news-header">
        <div className="news-header-inner">
          <div>
            <h1 className="news-title">📰 Notícias</h1>
            <p className="news-subtitle">Fique por dentro de tudo da Copa 2026</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary news-new-btn" onClick={openCreate}>
              + Nova Publicação
            </button>
          )}
        </div>

        <div className="news-filters">
          {['Todos', ...TAGS.map(t => t.value)].map(tab => (
            <button
              key={tab}
              className={`news-filter-btn ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {TAGS.find(t => t.value === tab)?.label || '🌐 Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="news-feed">
        {filtered.length === 0 && (
          <div className="news-empty">
            <span>📭</span>
            <p>Nenhuma notícia por aqui ainda.</p>
            {isAdmin && <button className="btn btn-primary" onClick={openCreate}>Publicar agora</button>}
          </div>
        )}

        {filtered.map(post => {
          const tag       = TAG_MAP[post.tag] || TAG_MAP['Notícia'];
          const hasLiked  = likes[post.id]?.has(user?.id) || false;
          const likeCount = likes[post.id]?.size || 0;
          const cntKey    = post.id;
          const cmtCount  = commentCounts[cntKey] ?? 0;
          const isExp     = expandedPosts.has(post.id);
          const comments  = postComments[post.id] || [];

          return (
            <article key={post.id} className={`news-card${post.is_pinned ? ' pinned' : ''}${!post.is_published ? ' draft' : ''}`}>

              {/* Cover media (image or video) */}
              {post.image_url && (
                isVideoUrl(post.image_url)
                  ? <div className="news-card-video-wrap">
                      <video className="news-card-video" src={post.image_url} controls playsInline preload="metadata" />
                    </div>
                  : <img className="news-card-image" src={post.image_url} alt={post.title} />
              )}

              <div className="news-card-body">
                {/* Meta */}
                <div className="news-card-meta">
                  {post.is_pinned && <span className="badge-pin">📌 Fixado</span>}
                  {!post.is_published && <span className="badge-draft">Rascunho</span>}
                  <span className="badge-tag" style={{ background: tag.color }}>{tag.label}</span>
                  <span className="news-date">{timeAgo(post.created_at)}</span>
                  {isAdmin && (
                    <div className="news-admin-btns">
                      <button className="news-adm-btn" title="Editar" onClick={() => openEdit(post)}>✏️</button>
                      <button className="news-adm-btn danger" title="Excluir" onClick={() => handleDeletePost(post.id)}>🗑️</button>
                    </div>
                  )}
                </div>

                <h2 className="news-card-title">{post.title}</h2>

                <div className="news-card-content">
                  {post.content.split('\n').map((line, i) => (
                    <p key={i}>{line || ' '}</p>
                  ))}
                </div>

                {/* Author */}
                <div className="news-card-author">
                  <div className="news-author-av" style={{ background: post.profiles?.avatar_url ? 'transparent' : avatarColor(post.profiles?.username || '') }}>
                    {post.profiles?.avatar_url
                      ? <img src={post.profiles.avatar_url} alt="" />
                      : initials(post.profiles?.username || 'A')}
                  </div>
                  <span>{post.profiles?.username || 'Admin'}</span>
                </div>
              </div>

              {/* Footer: like + comment */}
              <div className="news-card-footer">
                <button
                  className={`news-like-btn${hasLiked ? ' liked' : ''}${likeAnim[post.id] ? ' anim' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <span className="like-heart">{hasLiked ? '❤️' : '🤍'}</span>
                  <span className="like-count">{likeCount > 0 ? likeCount : ''}</span>
                </button>

                <button className="news-cmt-btn" onClick={() => toggleComments(post.id)}>
                  💬 {cmtCount > 0 ? cmtCount : ''} {cmtCount === 1 ? 'comentário' : 'comentários'}
                </button>
              </div>

              {/* Comments section */}
              {isExp && (
                <div className="news-comments">
                  {loadingCmts[post.id] && (
                    <div className="cmts-loading"><div className="spinner-sm" /></div>
                  )}

                  {!loadingCmts[post.id] && comments.length === 0 && (
                    <p className="cmts-empty">Seja o primeiro a comentar! 💬</p>
                  )}

                  {comments.map(c => (
                    <div key={c.id} className="cmt-item">
                      <div className="cmt-avatar" style={{ background: c.profiles?.avatar_url ? 'transparent' : avatarColor(c.username) }}>
                        {c.profiles?.avatar_url
                          ? <img src={c.profiles.avatar_url} alt="" />
                          : initials(c.username)}
                      </div>
                      <div className="cmt-body">
                        <div className="cmt-meta">
                          <strong>{c.username}</strong>
                          <span className="cmt-time">{timeAgo(c.created_at)}</span>
                          {(isAdmin || c.user_id === user?.id) && (
                            <button className="cmt-del-btn" onClick={() => handleDeleteComment(post.id, c.id)}>✕</button>
                          )}
                        </div>
                        <p>{c.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Comment input */}
                  <div className="cmt-input-row">
                    <div className="cmt-input-avatar" style={{ background: profile?.avatar_url ? 'transparent' : avatarColor(profile?.username || '') }}>
                      {profile?.avatar_url
                        ? <img src={profile.avatar_url} alt="" />
                        : initials(profile?.username || '')}
                    </div>
                    <input
                      className="cmt-input"
                      placeholder="Escrever comentário..."
                      value={commentInput[post.id] || ''}
                      onChange={e => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleComment(post.id); }}
                      disabled={sendingCmt[post.id]}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleComment(post.id)}
                      disabled={!commentInput[post.id]?.trim() || sendingCmt[post.id]}
                    >
                      {sendingCmt[post.id] ? '...' : '→'}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Admin modal: criar / editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal news-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingPost ? 'Editar Publicação' : 'Nova Publicação'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="news-form">
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Título da publicação..."
                  maxLength={120}
                />
              </div>

              <div className="form-group">
                <label>Conteúdo *</label>
                <textarea
                  className="news-textarea"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Escreva o conteúdo aqui... (Enter = nova linha)"
                  rows={7}
                />
              </div>

              <div className="form-group">
                <label>📷 Foto ou vídeo de capa (opcional)</label>

                {/* Drop zone */}
                <div
                  className={`media-drop-zone${dragOver ? ' drag-over' : ''}${uploading ? ' uploading' : ''}`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                >
                  {uploading ? (
                    <div className="media-dz-uploading">
                      <div className="spinner-sm" />
                      <span>Enviando para o servidor...</span>
                    </div>
                  ) : mediaPreview ? (
                    <div className="media-dz-preview">
                      {mediaIsVideo
                        ? <video src={mediaPreview} className="media-preview-el" muted playsInline />
                        : <img   src={mediaPreview} className="media-preview-el" alt="capa" />}
                      <div className="media-dz-overlay">
                        <button className="media-dz-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>🔄 Trocar</button>
                        <button className="media-dz-btn danger" onClick={e => { e.stopPropagation(); clearMedia(); }}>🗑️ Remover</button>
                      </div>
                    </div>
                  ) : (
                    <div className="media-dz-empty">
                      <div className="media-dz-icon">📁</div>
                      <strong>Clique ou arraste aqui</strong>
                      <span>Fotos: JPG, PNG, GIF &nbsp;·&nbsp; Vídeos: MP4, MOV &nbsp;·&nbsp; Máx 50MB</span>
                    </div>
                  )}
                </div>

                {uploadErr && <p className="media-upload-err">{uploadErr}</p>}
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileSelect} />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Categoria</label>
                  <select className="news-select" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
                    {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Opções</label>
                  <div className="news-toggles">
                    <label className="toggle-lbl">
                      <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
                      <span>📌 Fixar no topo</span>
                    </label>
                    <label className="toggle-lbl">
                      <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                      <span>✅ Publicar agora</span>
                    </label>
                  </div>
                </div>
              </div>

              {formError && <div className="alert alert-error">{formError}</div>}

              <div className="news-form-actions">
                <button className="btn btn-soft" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSubmitPost} disabled={submitting}>
                  {submitting ? 'Salvando...' : editingPost ? 'Salvar alterações' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
