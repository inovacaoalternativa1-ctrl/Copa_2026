import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../services/supabase';
import { usePush } from '../hooks/usePush';
import LuckyAnnouncementModal from './LuckyAnnouncementModal';
import Round32AnnouncementModal from './Round32AnnouncementModal';
import QuarterfinalsAnnouncementModal from './QuarterfinalsAnnouncementModal';
import './Layout.css';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Layout() {
  const { user, profile, signOut, isAdmin, isAndrey, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnChat = location.pathname === '/chat';
  const isOnChatRef = useRef(isOnChat);
  const [unreadChat, setUnreadChat] = useState(0);
  const { isSupported: pushSupported, iosNeedsPWA, permission: pushPermission, subscribed: pushSubscribed, loading: pushLoading, toggle: pushToggle } = usePush();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const fileInputRef = useRef(null);

  // ── Chat não lidas ───────────────────────────────────────────────────────
  useEffect(() => { isOnChatRef.current = isOnChat; }, [isOnChat]);

  useEffect(() => {
    if (isOnChat) {
      setUnreadChat(0);
      localStorage.setItem('copa_chat_last_seen', new Date().toISOString());
    }
  }, [isOnChat]);

  useEffect(() => {
    const lastSeen = localStorage.getItem('copa_chat_last_seen');
    if (lastSeen && !isOnChatRef.current) {
      supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .neq('is_moderated', true)
        .gt('created_at', lastSeen)
        .then(({ count }) => setUnreadChat(count || 0));
    }
    const channel = supabase
      .channel('chat-fab-tracker')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        if (!payload.new.is_moderated && !isOnChatRef.current) {
          setUnreadChat(prev => prev + 1);
        }
      })
      .subscribe();
    return () => channel.unsubscribe();
  }, []); // eslint-disable-line
  // ────────────────────────────────────────────────────────────────────────

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 400;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
    };
    img.src = objectUrl;
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = async () => {
    if (!avatarFile || !user) return;
    setUploading(true);
    setUploadError('');
    const compressed = await compressImage(avatarFile);
    const filePath = `${user.id}/avatar`;
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressed, { upsert: true, contentType: 'image/jpeg' });
    if (uploadErr) {
      console.error('[Avatar] Upload error:', uploadErr.message, uploadErr);
      setUploadError(`Erro: ${uploadErr.message}`);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    await refreshProfile();
    setShowAvatarModal(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setUploading(false);
  };

  const closeModal = () => {
    setShowAvatarModal(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setUploadError('');
    setNewUsername('');
    setUsernameError('');
    setUsernameSaved(false);
  };

  const getUsernameCooldown = () => {
    if (!profile?.username_changed_at) return { canChange: true, daysLeft: 0 };
    const changed = new Date(profile.username_changed_at);
    const diffMs = Date.now() - changed.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays >= 14) return { canChange: true, daysLeft: 0 };
    return { canChange: false, daysLeft: Math.ceil(14 - diffDays) };
  };

  const handleUsernameSave = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed) { setUsernameError('Digite um nome válido.'); return; }
    if (trimmed.length < 3) { setUsernameError('Mínimo de 3 caracteres.'); return; }
    if (trimmed.length > 30) { setUsernameError('Máximo de 30 caracteres.'); return; }
    if (trimmed === profile?.username) { setUsernameError('O nome é igual ao atual.'); return; }

    const { canChange } = getUsernameCooldown();
    if (!canChange) return;

    setSavingUsername(true);
    setUsernameError('');

    // Tenta salvar com username_changed_at; se a coluna não existir ainda, salva só o username
    let result = await supabase
      .from('profiles')
      .update({ username: trimmed, username_changed_at: new Date().toISOString() })
      .eq('id', user.id);

    if (result.error?.message?.includes('username_changed_at')) {
      result = await supabase
        .from('profiles')
        .update({ username: trimmed })
        .eq('id', user.id);
    }

    if (result.error) {
      console.error('[Username] Erro ao salvar:', result.error.message, result.error);
      setUsernameError(`Erro: ${result.error.message}`);
      setSavingUsername(false);
      return;
    }

    // Atualiza o nome em todas as mensagens anteriores do usuário
    await supabase
      .from('chat_messages')
      .update({ username: trimmed })
      .eq('user_id', user.id);

    await refreshProfile();
    setNewUsername('');
    setUsernameSaved(true);
    setSavingUsername(false);
  };

  return (
    <div className="layout">
      <div className="topbar" />
      <header className="navbar">
        <div className="nav-inner">
          <Link to="/" className="brand">
            <div className="brand-mark">⚽</div>
            <div>
              <div className="brand-name">Copa Simulada</div>
              <div className="brand-sub">Alternativa Serviços</div>
            </div>
          </Link>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <NavLink to="/" end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>⚽ Palpites</NavLink>
            <NavLink to="/quiz" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>🧠 Quiz</NavLink>
            <NavLink to="/ranking" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>🏆 Ranking</NavLink>
            <NavLink to="/chat" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>💬 Chat</NavLink>
            <NavLink to="/noticias" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>📰 Notícias</NavLink>
            <NavLink to="/parceiros" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>🤝 Parceiros</NavLink>
            <NavLink to="/premios" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>🎁 Prêmios</NavLink>
            <NavLink to="/palpite-sorte" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>🍀 Palpite da Sorte</NavLink>
            {isAdmin && <NavLink to="/admin" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>⚙️ Admin</NavLink>}
            {isAndrey && <NavLink to="/admin-andrey" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>👑 Admin Andrey</NavLink>}
          </nav>

          <div className="nav-user">
            {iosNeedsPWA && (
              <button
                className="push-bell-btn"
                onClick={() => setShowIOSModal(true)}
                title="Ativar notificações"
              >
                🔕
              </button>
            )}
            {pushSupported && !iosNeedsPWA && pushPermission !== 'denied' && (
              <button
                className={`push-bell-btn ${pushSubscribed ? 'active' : ''}`}
                onClick={pushToggle}
                disabled={pushLoading}
                title={pushSubscribed ? 'Desativar notificações de placar' : 'Ativar notificações de placar'}
              >
                {pushSubscribed ? '🔔' : '🔕'}
              </button>
            )}
            <button
              className="nav-avatar-btn"
              onClick={() => setShowAvatarModal(true)}
              title="Alterar foto de perfil"
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} className="nav-avatar-img" />
                : <span className="nav-avatar-initials">{getInitials(profile?.username)}</span>}
            </button>
            <span className="user-name">{profile?.username}</span>
            <button className="btn btn-soft btn-sm" onClick={handleSignOut}>Sair</button>
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>© 2026 Copa Simulada · Alternativa Serviços · Participação gratuita</p>
      </footer>

      {/* Modal iOS - Adicionar à tela inicial */}
      {showIOSModal && (
        <div className="modal-overlay" onClick={() => setShowIOSModal(false)}>
          <div className="modal" style={{maxWidth: 360}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔔 Ativar Notificações</span>
              <button className="modal-close" onClick={() => setShowIOSModal(false)}>✕</button>
            </div>
            <div style={{padding: '20px', textAlign: 'center'}}>
              <p style={{marginBottom: 16, fontSize: 15}}>Para receber notificações no iPhone, adicione o app à sua Tela de Início:</p>
              <ol style={{textAlign: 'left', lineHeight: 2, fontSize: 14, paddingLeft: 20}}>
                <li>Toque em <strong>Compartilhar</strong> <span style={{fontSize:18}}>⎋</span> no Safari</li>
                <li>Toque em <strong>"Adicionar à Tela de Início"</strong></li>
                <li>Abra o app pela Tela de Início</li>
                <li>Toque no sininho 🔕 para ativar</li>
              </ol>
            </div>
            <div style={{padding: '0 20px 20px'}}>
              <button className="btn btn-primary btn-sm" style={{width:'100%'}} onClick={() => setShowIOSModal(false)}>Entendi</button>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante do Chat */}
      {!isOnChat && (
        <Link
          to="/chat"
          className="chat-fab"
          title="Chat ao vivo"
          onClick={() => setUnreadChat(0)}
        >
          💬
          {unreadChat > 0 && (
            <span className="chat-fab-badge">{unreadChat > 99 ? '99+' : unreadChat}</span>
          )}
        </Link>
      )}

      {/* Modal de edição de perfil */}
      {showAvatarModal && (() => {
        const { canChange, daysLeft } = getUsernameCooldown();
        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" style={{maxWidth: 420}} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Editar Perfil</span>
                <button className="modal-close" onClick={closeModal}>✕</button>
              </div>

              {/* ── Seção: Foto ── */}
              <div className="profile-section">
                <p className="profile-section-label">Foto de perfil</p>
                <div className="avatar-modal-body">
                  <div
                    className="avatar-preview-circle"
                    onClick={() => fileInputRef.current?.click()}
                    title="Clique para escolher uma foto"
                  >
                    {(avatarPreview || profile?.avatar_url)
                      ? <img src={avatarPreview || profile.avatar_url} alt="preview" />
                      : <span>{getInitials(profile?.username)}</span>}
                    <div className="avatar-preview-overlay">📷</div>
                  </div>
                  <p className="avatar-hint">Clique na imagem para escolher uma foto</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {uploadError && <p className="avatar-error">{uploadError}</p>}
                  <button
                    className="btn btn-primary btn-sm"
                    style={{width: '100%'}}
                    disabled={!avatarFile || uploading}
                    onClick={handleAvatarSave}
                  >
                    {uploading ? 'Salvando...' : 'Salvar foto'}
                  </button>
                </div>
              </div>

              <div className="profile-divider" />

              {/* ── Seção: Nome ── */}
              <div className="profile-section">
                <p className="profile-section-label">Nome de usuário</p>
                <p className="profile-current-name">Atual: <strong>{profile?.username}</strong></p>

                {canChange ? (
                  <div className="profile-username-form">
                    <input
                      className="profile-username-input"
                      type="text"
                      placeholder="Novo nome..."
                      value={newUsername}
                      maxLength={30}
                      onChange={e => { setNewUsername(e.target.value); setUsernameError(''); setUsernameSaved(false); }}
                      onKeyDown={e => e.key === 'Enter' && handleUsernameSave()}
                    />
                    {usernameError && <p className="avatar-error">{usernameError}</p>}
                    {usernameSaved && <p className="username-saved">✓ Nome alterado com sucesso!</p>}
                    <button
                      className="btn btn-primary btn-sm"
                      style={{width: '100%'}}
                      disabled={!newUsername.trim() || savingUsername}
                      onClick={handleUsernameSave}
                    >
                      {savingUsername ? 'Salvando...' : 'Salvar nome'}
                    </button>
                    {profile?.username_changed_at && (
                      <p className="avatar-hint">Após alterar, próxima mudança disponível em 14 dias.</p>
                    )}
                  </div>
                ) : (
                  <div className="username-cooldown">
                    <span className="username-cooldown-icon">🔒</span>
                    <p>Você já alterou seu nome recentemente.</p>
                    <p className="username-cooldown-days">Disponível em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong></p>
                  </div>
                )}
              </div>

              <div style={{padding: '0 20px 20px'}}>
                <button className="btn btn-soft btn-sm" style={{width:'100%'}} onClick={closeModal}>Fechar</button>
              </div>
            </div>
          </div>
        );
      })()}

      <LuckyAnnouncementModal />
      <Round32AnnouncementModal />
      <QuarterfinalsAnnouncementModal />
    </div>
  );
}
