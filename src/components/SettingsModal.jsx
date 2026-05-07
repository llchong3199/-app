import { useState, useRef, useEffect } from 'react'
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
  const importRef = useRef(null)
  const musicInputRef = useRef(null)
  const [showMusic, setShowMusic] = useState(() => localStorage.getItem('et-show-music') !== 'false')
  const [customTracks, setCustomTracks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('et-custom-music') || '[]') }
    catch { return [] }
  })

  function clearMsg() { setError(''); setSuccess('') }

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

  function toggleShowMusic() {
    const next = !showMusic
    setShowMusic(next)
    localStorage.setItem('et-show-music', next)
    clearMsg()
    setSuccess(next ? '音乐播放器已显示' : '音乐播放器已隐藏')
  }

  function handleAddMusic(e) {
    const files = e.target.files
    if (!files?.length) return
    const reader = new FileReader()
    const file = files[0]
    const name = file.name.replace(/\.(mp3|wav|ogg|flac|m4a)$/i, '')
    reader.onload = () => {
      const tracks = [...customTracks, { name, data: reader.result }]
      setCustomTracks(tracks)
      localStorage.setItem('et-custom-music', JSON.stringify(tracks))
      setSuccess(`已添加: ${name}`)
    }
    reader.onerror = () => setError('读取文件失败')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleDeleteTrack(i) {
    const tracks = customTracks.filter((_, idx) => idx !== i)
    setCustomTracks(tracks)
    localStorage.setItem('et-custom-music', JSON.stringify(tracks))
    setSuccess('已移除自定义音乐')
  }

  function handleExport() {
    const userData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('et-data-')) userData[key] = localStorage.getItem(key)
    }
    const data = {
      users: localStorage.getItem('et-users'),
      session: localStorage.getItem('et-session'),
      userData,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Hello记账-数据备份-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setSuccess('数据已导出')
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.users && !data.userData) { setError('无效的数据文件'); return }
        if (data.users) localStorage.setItem('et-users', data.users)
        if (data.session) localStorage.setItem('et-session', data.session)
        if (data.userData) {
          for (const [key, val] of Object.entries(data.userData)) {
            localStorage.setItem(key, val)
          }
        }
        window.location.reload()
      } catch { setError('文件解析失败') }
    }
    reader.readAsText(file)
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

        {/* ── 音乐设置 ── */}
        <div className="settings-section">
          <label>音乐设置</label>
          <div className="settings-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text)' }}>显示音乐播放器</span>
            <button
              className={`toggle-switch ${showMusic ? 'on' : ''}`}
              onClick={toggleShowMusic}
              aria-label="切换音乐播放器"
            >
              <span className="toggle-knob" />
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="settings-export-btn" onClick={() => musicInputRef.current?.click()}>
              添加本地音乐
            </button>
            <input
              ref={musicInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.flac,.m4a,audio/*"
              style={{ display: 'none' }}
              onChange={handleAddMusic}
            />
          </div>
          {customTracks.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {customTracks.map((t, i) => (
                <div key={i} className="custom-track-row">
                  <span className="custom-track-name">🎵 {t.name}</span>
                  <button className="custom-track-del" onClick={() => handleDeleteTrack(i)} title="移除">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 数据导入/导出 ── */}
        <div className="settings-section">
          <label>数据管理</label>
          <div className="settings-row" style={{ gap: 10 }}>
            <button className="settings-export-btn" onClick={handleExport}>导出数据</button>
            <button className="settings-import-btn" onClick={() => importRef.current?.click()}>导入数据</button>
          </div>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>

        {error && <p className="settings-error">{error}</p>}
        {success && <p className="settings-success">{success}</p>}
      </div>
    </div>,
    document.body
  )
}
