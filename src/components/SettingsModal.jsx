import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AvatarPicker, UserAvatar } from './AvatarPicker'
import './SettingsModal.css'

const BUILTIN_NAMES = [
  'Kiss The Rain',
  '風のように',
  '交界 (伴奏)',
  '小野',
  '生命之名',
]

export function SettingsModal({ user, onUpdateAvatar, onUpdateUsername, onUpdatePassword, onClose }) {
  const [settingsTab, setSettingsTab] = useState('general')
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
  const previewRef = useRef(null)
  const [previewTrack, setPreviewTrack] = useState(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [showMusic, setShowMusic] = useState(() => localStorage.getItem('et-show-music') !== 'false')
  const [customTracks, setCustomTracks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('et-custom-music') || '[]') }
    catch { return [] }
  })

  function clearMsg() { setError(''); setSuccess('') }

  function stopPreview() {
    if (previewRef.current) {
      previewRef.current.pause()
      previewRef.current.currentTime = 0
    }
    setPreviewTrack(null)
    setPreviewPlaying(false)
  }

  function playPreview(file, name, idx) {
    if (previewTrack === idx && previewPlaying) {
      previewRef.current?.pause()
      setPreviewPlaying(false)
      return
    }
    stopPreview()
    const src = file.startsWith('data:') ? file : encodeURI(file)
    const audio = new Audio(src)
    audio.volume = 0.3
    audio.addEventListener('ended', () => { setPreviewPlaying(false); setPreviewTrack(null) })
    audio.addEventListener('pause', () => setPreviewPlaying(false))
    audio.addEventListener('play', () => setPreviewPlaying(true))
    audio.play().catch(() => {})
    previewRef.current = audio
    setPreviewTrack(idx)
    setPreviewPlaying(true)
  }

  function getFullTrackList() {
    const builtin = BUILTIN_NAMES.map((name, i) => ({
      name,
      file: `/music/${['Kiss The Rain（淡淡伤感）.mp3','S.E.N.S. - 風のように.mp3','交界 (伴奏).mp3','山野煮雨 - 小野.mp3','神隱少女 - 生命之名.mp3'][i]}`,
      builtin: true,
    }))
    const custom = customTracks.map(t => ({ name: t.name, file: t.data, builtin: false }))
    return [...builtin, ...custom]
  }

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
    if (previewTrack === BUILTIN_NAMES.length + i) stopPreview()
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

  const allTracks = getFullTrackList()

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
          <button className="settings-close" onClick={() => { stopPreview(); onClose() }}>×</button>
        </div>

        {/* ── 子标签页 ── */}
        <div className="settings-subtabs">
          <button
            className={`settings-subtab${settingsTab === 'general' ? ' active' : ''}`}
            onClick={() => { stopPreview(); setSettingsTab('general') }}
          >通用</button>
          <button
            className={`settings-subtab${settingsTab === 'music' ? ' active' : ''}`}
            onClick={() => { stopPreview(); setSettingsTab('music') }}
          >音乐</button>
        </div>

        {settingsTab === 'general' && (
          <>
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
          </>
        )}

        {settingsTab === 'music' && (
          <div className="music-page">
            {/* ── 统计 ── */}
            <div className="music-stats">
              <span>共 {allTracks.length} 首</span>
              <span>内置 {BUILTIN_NAMES.length} 首 · 自定义 {customTracks.length} 首</span>
            </div>

            {/* ── 添加按钮 ── */}
            <div className="music-add-row">
              <button className="settings-save-btn" onClick={() => musicInputRef.current?.click()}>
                + 添加本地音乐
              </button>
              <input
                ref={musicInputRef}
                type="file"
                accept=".mp3,.wav,.ogg,.flac,.m4a,audio/*"
                style={{ display: 'none' }}
                onChange={handleAddMusic}
              />
            </div>

            {/* ── 曲目列表 ── */}
            <div className="music-track-list">
              {allTracks.map((t, i) => (
                <div key={i} className={`music-track-item${previewTrack === i ? ' playing' : ''}`}>
                  <div className="music-track-left">
                    <button
                      className="music-track-play"
                      onClick={() => playPreview(t.file, t.name, i)}
                      title={previewTrack === i && previewPlaying ? '暂停' : '播放'}
                    >
                      {previewTrack === i && previewPlaying ? (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <rect x="8" y="5" width="2.5" height="14" rx="0.5" />
                          <rect x="13.5" y="5" width="2.5" height="14" rx="0.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <polygon points="8,5 19,12 8,19" />
                        </svg>
                      )}
                    </button>
                    <span className="music-track-label">
                      {t.name}
                      {t.builtin && <span className="music-track-badge">内置</span>}
                    </span>
                  </div>
                  {!t.builtin && (
                    <button
                      className="music-track-remove"
                      onClick={() => handleDeleteTrack(i - BUILTIN_NAMES.length)}
                      title="移除"
                    >×</button>
                  )}
                </div>
              ))}
            </div>

            {/* ── 音乐播放器开关 ── */}
            <div className="music-toggle-row">
              <span>页面顶部显示播放器</span>
              <button
                className={`toggle-switch ${showMusic ? 'on' : ''}`}
                onClick={() => {
                  const next = !showMusic
                  setShowMusic(next)
                  localStorage.setItem('et-show-music', next)
                }}
                aria-label="切换音乐播放器"
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        )}

        {error && <p className="settings-error">{error}</p>}
        {success && <p className="settings-success">{success}</p>}
      </div>
    </div>,
    document.body
  )
}
