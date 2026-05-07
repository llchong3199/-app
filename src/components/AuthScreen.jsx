import { useState, useEffect, useRef } from 'react'
import { AvatarPicker, UserAvatar } from './AvatarPicker'
import { DeletePigDialog } from './DeletePigDialog'
import './AuthScreen.css'

function DragDeco({ style, children }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)

  function onDown(e) {
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current) return
      setOffset({
        x: dragRef.current.ox + e.clientX - dragRef.current.sx,
        y: dragRef.current.oy + e.clientY - dragRef.current.sy,
      })
    }
    function onUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div
      style={{
        ...style,
        position: 'absolute',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        cursor: dragRef.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: dragRef.current ? 100 : undefined,
      }}
      onMouseDown={onDown}
    >
      <span className="auth-deco" style={{ pointerEvents: 'none', display: 'block' }}>
        {children}
      </span>
    </div>
  )
}

function PwField({ label, placeholder, value, onChange, autoFocus }) {
  const [show, setShow] = useState(false)

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    onChange({ target: { value: digits } })
  }

  return (
    <div className="auth-field">
      <label>{label}</label>
      <div className="auth-pw-wrap">
        <input
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={6}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          autoFocus={autoFocus}
        />
        <button type="button" className="auth-pw-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

function playLoginSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    const notes = [
      { freq: 523.3, time: 0 },
      { freq: 659.3, time: 0.1 },
      { freq: 783.99, time: 0.2 },
      { freq: 1046.5, time: 0.3 },
    ]
    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + time)
      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(0.3, now + time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.3)
      osc.start(now + time)
      osc.stop(now + time + 0.3)
    })
    if (ctx.state === 'suspended') ctx.resume()
  } catch (e) { /* ignore */ }
}

export function AuthScreen({ users, onLogin, onRegister, onUpdateAvatar, onVerifyPassword, onDeleteAccount }) {
  const [mode, setMode] = useState(users.length === 0 ? 'register' : 'select')
  const [selectedUser, setSelectedUser] = useState(null)
  const [password, setPassword] = useState('')
  const [form, setForm] = useState({ username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingAvatarUser, setEditingAvatarUser] = useState(null)
  const [deleteMode, setDeleteMode] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [showDeletePig, setShowDeletePig] = useState(false)

  function goSelect() {
    setMode('select'); setError(''); setPassword('')
    setDeleteMode(false); setDeletePassword(''); setDeleteError('')
    setShowDeletePig(false)
  }
  function goRegister() { setMode('register'); setError(''); setForm({ username: '', password: '', confirm: '' }) }

  function pickUser(user) {
    setSelectedUser(user)
    setPassword(''); setError('')
    setDeleteMode(false); setDeletePassword(''); setDeleteError('')
    setShowDeletePig(false)
    setMode('password')
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!password) { setError('请输入密码'); return }
    setLoading(true); setError('')
    try { await onLogin(selectedUser.username, password); playLoginSound() }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.username.trim()) { setError('请输入用户名'); return }
    if (form.password.length !== 6) { setError('密码须为 6 位数字'); return }
    if (form.password !== form.confirm) { setError('两次密码不一致'); return }
    setLoading(true); setError('')
    try { await onRegister(form.username.trim(), form.password) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()
    if (!deletePassword) { setDeleteError('请输入密码确认'); return }
    setLoading(true); setDeleteError('')
    try {
      await onVerifyPassword(selectedUser.id, deletePassword)
      setShowDeletePig(true)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleFinalDelete() {
    onDeleteAccount(selectedUser.id)
    goSelect()
  }

  function getAvatar(user) {
    return users.find(u => u.id === user.id)?.avatar ?? user.avatar
  }

  return (
    <div className="auth-screen">
      {showDeletePig && (
        <DeletePigDialog
          onCancel={() => setShowDeletePig(false)}
          onConfirmDelete={handleFinalDelete}
        />
      )}
      {editingAvatarUser && (
        <AvatarPicker
          onSelect={avatar => onUpdateAvatar(editingAvatarUser.id, avatar)}
          onClose={() => setEditingAvatarUser(null)}
        />
      )}

      <div className="auth-brand">
        <DragDeco style={{ top: -35, left: -15 }}>🌸</DragDeco>
        <DragDeco style={{ top: -30, right: -10 }}>✨</DragDeco>
        <DragDeco style={{ bottom: -28, left: '15%' }}>💕</DragDeco>
        <DragDeco style={{ top: -28, left: '45%' }}>☁️</DragDeco>
        <DragDeco style={{ bottom: -32, right: '15%' }}>🍓</DragDeco>
        <DragDeco style={{ top: -22, left: '30%' }}>⭐</DragDeco>
        <span className="auth-logo">🎀</span>
        <h1>Hello 记账</h1>
        <p>Kitty 陪你，记录每一笔 🎀</p>
      </div>

      <div className="auth-card">

        {/* ── 选择用户 ── */}
        {mode === 'select' && (
          <>
            <h2>选择账户</h2>
            <div className="user-grid-wrap">
              <div className="user-grid">
                {users.map(u => (
                  <div key={u.id} className="user-card-wrap">
                    <button className="user-btn" onClick={() => pickUser(u)}>
                      <UserAvatar avatar={getAvatar(u)} size={48} />
                      <span className="user-name">{u.username}</span>
                    </button>
                    <button
                      className="user-edit-btn"
                      title="修改头像"
                      onClick={e => { e.stopPropagation(); setEditingAvatarUser(u) }}
                    >✏️</button>
                  </div>
                ))}
              </div>
            </div>
            <button className="auth-link" onClick={goRegister}>+ 创建新账户</button>
          </>
        )}

        {/* ── 输入密码 ── */}
        {mode === 'password' && !deleteMode && (
          <>
            <button className="auth-back" onClick={goSelect}>←</button>
            <div className="auth-user-display">
              <UserAvatar avatar={getAvatar(selectedUser)} size={56} />
              <h2>{selectedUser?.username}</h2>
            </div>
            <form onSubmit={handleLogin}>
              <PwField
                label="密码"
                placeholder="输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? '登录中…' : '登录'}
              </button>
            </form>
            <button className="auth-delete-link" onClick={() => setDeleteMode(true)}>
              删除此账户
            </button>
          </>
        )}

        {/* ── 删除账户确认 ── */}
        {mode === 'password' && deleteMode && (
          <>
            <button className="auth-back" onClick={() => { setDeleteMode(false); setDeletePassword(''); setDeleteError('') }}>←</button>
            <div className="auth-user-display">
              <UserAvatar avatar={getAvatar(selectedUser)} size={56} />
              <h2>{selectedUser?.username}</h2>
            </div>
            <p className="auth-delete-warning">删除账户将清除所有数据，不可恢复。</p>
            <form onSubmit={handleDeleteAccount}>
              <PwField
                label="输入密码确认删除"
                placeholder="输入密码"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                autoFocus
              />
              {deleteError && <p className="auth-error">{deleteError}</p>}
              <button type="submit" className="auth-btn auth-btn-danger" disabled={loading}>
                {loading ? '删除中…' : '确认删除'}
              </button>
            </form>
          </>
        )}

        {/* ── 注册 ── */}
        {mode === 'register' && (
          <>
            {users.length > 0 && <button className="auth-back" onClick={goSelect}>←</button>}
            <h2>创建账户</h2>
            <form onSubmit={handleRegister}>
              <div className="auth-field">
                <label>用户名</label>
                <input
                  type="text"
                  placeholder="给自己起个名字"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  autoFocus
                />
              </div>
              <PwField
                label="密码"
                placeholder="6 位数字"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
              <PwField
                label="确认密码"
                placeholder="再输一次 6 位数字"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              />
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? '创建中…' : '创建账户'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}
