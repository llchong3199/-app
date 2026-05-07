import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AvatarPicker, UserAvatar } from './AvatarPicker'
import './SettingsModal.css'

const BUILTIN_NAMES = [
  '星辰大海',
  'Counting Stars',
  '少年',
  '小美满',
  '做自己的光',
  '太阳之光',
  '那些年',
  '我相信',
  '一路生花',
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
  const [saving, setSaving] = useState(false)
  const [hoverClose, setHoverClose] = useState(false)
  const [pendingAvatar, setPendingAvatar] = useState(null)
  const importRef = useRef(null)
  const previewRef = useRef(null)
  const [previewTrack, setPreviewTrack] = useState(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [showMusic, setShowMusic] = useState(() => localStorage.getItem('et-show-music') !== 'false')
  const [hiddenBuiltin, setHiddenBuiltin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('et-hidden-builtin') || '[]') }
    catch { return [] }
  })

  const hasPwChange = currentPw && newPw.length === 6 && newPw === confirmPw
  const isDirty = username !== user.username || pendingAvatar !== null ||
    currentPw !== '' || newPw !== '' || confirmPw !== ''

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
    clearMsg()
    const src = file.startsWith('data:') ? file : encodeURI(file)
    const audio = new Audio(src)
    audio.volume = 0.1
    audio.addEventListener('ended', () => { setPreviewPlaying(false); setPreviewTrack(null) })
    audio.addEventListener('pause', () => setPreviewPlaying(false))
    audio.addEventListener('play', () => setPreviewPlaying(true))
    audio.addEventListener('error', () => {
      setError(`无法播放「${name}」，文件格式可能不受支持或已损坏`)
      setPreviewPlaying(false)
      setPreviewTrack(null)
    })
    audio.play().catch(() => {
      setError(`无法播放「${name}」，文件格式可能不受支持或已损坏`)
      setPreviewPlaying(false)
      setPreviewTrack(null)
    })
    previewRef.current = audio
    setPreviewTrack(idx)
    setPreviewPlaying(true)
  }

  function getFullTrackList() {
    return BUILTIN_NAMES.map((name, i) => ({
      name,
      file: `/music/${['黄霄雲 - 星辰大海.mp3','OneRepublic - Counting Stars.mp3','夢然 - 少年.mp3','周深 - 小美满.mp3','善宇 - 做自己的光.mp3','太阳之光.mp3','姜创钢琴 - 那些年.mp3','杨培安 - 我相信.mp3','溫奕心 - 一路生花.mp3'][i]}`,
      builtin: true,
      builtinIdx: i,
    })).filter(t => !hiddenBuiltin.includes(t.builtinIdx))
  }

  async function handleSaveAll() {
    clearMsg()
    setSaving(true)
    const errors = []

    // Save avatar
    if (pendingAvatar !== null) {
      try { onUpdateAvatar(user.id, pendingAvatar) }
      catch { errors.push('头像保存失败') }
    }

    // Save username
    if (username.trim() && username.trim() !== user.username) {
      try {
        onUpdateUsername(user.id, username.trim())
      } catch (err) { errors.push(err.message) }
    }

    // Save password
    if (currentPw || newPw || confirmPw) {
      if (!currentPw) { errors.push('请输入当前密码') }
      else if (newPw.length !== 6) { errors.push('新密码须为 6 位数字') }
      else if (newPw !== confirmPw) { errors.push('两次密码不一致') }
      else {
        try {
          await onUpdatePassword(user.id, currentPw, newPw)
          setCurrentPw(''); setNewPw(''); setConfirmPw('')
        } catch (err) { errors.push(err.message) }
      }
    }

    setSaving(false)
    if (errors.length) { setError(errors.join('；')) }
    else {
      setPendingAvatar(null)
      setSuccess('全部设置已保存')
    }
  }

  async function handleCloseClick() {
    if (isDirty && hoverClose) {
      await handleSaveAll()
    }
    stopPreview()
    onClose()
  }

  function handleDeleteTrack(track) {
    const newHidden = [...hiddenBuiltin, track.builtinIdx]
    setHiddenBuiltin(newHidden)
    localStorage.setItem('et-hidden-builtin', JSON.stringify(newHidden))
    setSuccess(`已隐藏: ${track.name}`)
    if (previewTrack === track.builtinIdx) stopPreview()
  }

  function handleExport() {
    const allData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('et-')) allData[key] = localStorage.getItem(key)
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
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
        const keys = Object.keys(data).filter(k => k.startsWith('et-'))
        if (keys.length === 0) { setError('无效的数据文件'); return }
        for (const key of keys) {
          localStorage.setItem(key, data[key])
        }
        window.location.reload()
      } catch { setError('文件解析失败') }
    }
    reader.readAsText(file)
  }

  const allTracks = getFullTrackList()

  return createPortal(
    <div className="settings-overlay">
      {showAvatarPicker && (
        <AvatarPicker
          onSelect={avatar => { setPendingAvatar(avatar); setShowAvatarPicker(false) }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-sticky-top">
          <div className="settings-header">
            <h2>设置</h2>
            <button
              className={`settings-close${isDirty && hoverClose ? ' save-mode' : ''}`}
              onClick={handleCloseClick}
              onMouseEnter={() => setHoverClose(true)}
              onMouseLeave={() => setHoverClose(false)}
              title={isDirty && hoverClose ? '保存并关闭' : '关闭'}
            >
              {isDirty && hoverClose ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 14a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm2-10H6V4h8v3z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              )}
            </button>
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
        </div>

        <div className="settings-content">
        {settingsTab === 'general' && (
          <>
            {/* ── 头像 ── */}
            <div className="settings-section">
              <label>头像</label>
              <button className="settings-avatar-btn" onClick={() => setShowAvatarPicker(true)}>
                <UserAvatar avatar={pendingAvatar ?? user.avatar} size={64} />
                <span className="settings-avatar-hint">点击更换</span>
              </button>
            </div>

            {/* ── 用户名 ── */}
            <div className="settings-section">
              <label>用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="settings-input"
              />
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
          <>
            <div className="settings-section">
              <label>曲目</label>
              <div className="music-stats">
                <span>共 {allTracks.length} 首</span>
                <span style={{ fontSize: 12 }}>
                  {hiddenBuiltin.length > 0 && (
                    <button
                      className="music-restore-btn"
                      onClick={() => {
                        setHiddenBuiltin([])
                        localStorage.removeItem('et-hidden-builtin')
                        setSuccess('已恢复所有内置音乐')
                      }}
                      title="恢复隐藏的内置音乐"
                    >恢复 {hiddenBuiltin.length} 首隐藏</button>
                  )}
                </span>
              </div>

              <div className="music-track-list">
                {allTracks.map((t, i) => (
                  <div key={`b-${i}`} className={`music-track-item${previewTrack === i ? ' playing' : ''}`}>
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
                      <span className="music-track-label">{t.name}</span>
                    </div>
                    <button
                      className="music-track-remove"
                      onClick={() => handleDeleteTrack(t)}
                      title="隐藏"
                    >×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <label>播放器</label>
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
          </>
        )}

        </div>

        {/* ── 底部全局保存 ── */}
        {isDirty && (
          <button
            className="settings-save-all"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? '保存中…' : '保存设置'}
          </button>
        )}

        {error && <p className="settings-error">{error}</p>}
        {success && <p className="settings-success">{success}</p>}
      </div>
    </div>,
    document.body
  )
}
