import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AvatarPicker, UserAvatar } from './AvatarPicker'
import './SettingsModal.css'

export function SettingsModal({ user, onUpdateAvatar, onUpdateUsername, onUpdatePassword, onClose }) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [username, setUsername] = useState(user.username)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState('')

  function clearMsg() { setError(''); setSuccess('') }

  function handleSaveUsername() {
    if (!username.trim()) { setError('用户名不能为空'); return }
    if (username.trim() === user.username) { setSuccess('用户名未改变'); return }
    clearMsg()
    try {
      onUpdateUsername(user.id, username.trim())
      setSuccess('用户名已更新')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSavePassword() {
    clearMsg()
    if (!currentPw) { setError('请输入当前密码'); return }
    if (newPw.length !== 6) { setError('新密码须为 6 位数字'); return }
    if (newPw !== confirmPw) { setError('两次密码不一致'); return }
    setSaving('password')
    try {
      await onUpdatePassword(user.id, currentPw, newPw)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setSuccess('密码已更新')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving('')
    }
  }

  return createPortal(
    <div className="settings-overlay" onClick={onClose}>
      {showAvatarPicker && (
        <AvatarPicker
          onSelect={avatar => onUpdateAvatar(user.id, avatar)}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>设置</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        {/* ── 头像 ── */}
        <div className="settings-section">
          <label>头像</label>
          <button className="settings-avatar-btn" onClick={() => setShowAvatarPicker(true)}>
            <UserAvatar avatar={user.avatar} size={64} />
            <span className="settings-avatar-hint">点击更换</span>
          </button>
        </div>

        {/* ── 用户名 ── */}
        <div className="settings-section">
          <label>用户名</label>
          <div className="settings-row">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="settings-input"
            />
            <button className="settings-save-btn" onClick={handleSaveUsername}>保存</button>
          </div>
        </div>

        {/* ── 密码 ── */}
        <div className="settings-section">
          <label>修改密码</label>
          <div className="settings-field">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="当前密码"
              value={currentPw}
              onChange={e => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCurrentPw(d)
              }}
              className="settings-input"
            />
          </div>
          <div className="settings-field">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="新密码（6 位数字）"
              value={newPw}
              onChange={e => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 6)
                setNewPw(d)
              }}
              className="settings-input"
            />
          </div>
          <div className="settings-field">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="确认新密码"
              value={confirmPw}
              onChange={e => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 6)
                setConfirmPw(d)
              }}
              className="settings-input"
            />
          </div>
          <button
            className="settings-save-btn"
            onClick={handleSavePassword}
            disabled={saving === 'password'}
          >
            {saving === 'password' ? '保存中…' : '保存密码'}
          </button>
        </div>

        {error && <p className="settings-error">{error}</p>}
        {success && <p className="settings-success">{success}</p>}
      </div>
    </div>,
    document.body
  )
}
