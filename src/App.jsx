import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from './hooks/useAuth'
import { useExpenses } from './hooks/useExpenses'
import { useSuccessSound } from './hooks/useSuccessSound'
import { AuthScreen } from './components/AuthScreen'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { Charts } from './components/Charts'
import { CategoryManager } from './components/CategoryManager'
import { BudgetPanel } from './components/BudgetPanel'
import { SavingsPage } from './components/SavingsPage'
import { PiggyDialog } from './components/PiggyDialog'
import { MonthWheelPicker } from './components/DateWheelPicker'
import { SuccessModal } from './components/SuccessModal'
import { UserAvatar } from './components/AvatarPicker'
import { SettingsModal } from './components/SettingsModal'
import './App.css'

const TABS = ['记录', '图表', '预算', '储蓄', '分类']

const BUILTIN_PLAYLIST = [
  { name: '星辰大海', file: '/music/黄霄雲 - 星辰大海.mp3' },
  { name: 'Counting Stars', file: '/music/OneRepublic - Counting Stars.mp3' },
  { name: '少年', file: '/music/夢然 - 少年.mp3' },
  { name: '小美满', file: '/music/周深 - 小美满.mp3' },
  { name: '做自己的光', file: '/music/善宇 - 做自己的光.mp3' },
  { name: '太阳之光', file: '/music/太阳之光.mp3' },
  { name: '那些年', file: '/music/姜创钢琴 - 那些年.mp3' },
  { name: '我相信', file: '/music/杨培安 - 我相信.mp3' },
  { name: '一路生花', file: '/music/溫奕心 - 一路生花.mp3' },
]

function getPlaylist() {
  const hiddenIdx = JSON.parse(localStorage.getItem('et-hidden-builtin') || '[]')
  return BUILTIN_PLAYLIST.filter((_, i) => !hiddenIdx.includes(i))
}

function MainApp({ user, users, onLogout, onUpdateAvatar, onUpdateUsername, onUpdatePassword }) {
  const {
    expenses, categories, addExpense, deleteExpense, editExpense, addCategory, deleteCategory,
    incomeByMonth, monthlyIncome, setIncomeForMonth, budgets, setCategoryBudget,
    savingsGoals, addSavingsGoal, deleteSavingsGoal, depositToGoal,
  } = useExpenses(user.id)

  const [tab, setTab] = useState('记录')
  const [filter, setFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7))
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [successExpense, setSuccessExpense] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showPiggy, setShowPiggy] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [piggyIncome, setPiggyIncome] = useState(0)
  const quoteIndexRef = useRef(0)
  const closeTimerRef = useRef(null)
  const playSound = useSuccessSound()

  const audioRef = useRef(null)
  const [musicPlaying, setMusicPlaying] = useState(true)
  const [musicTime, setMusicTime] = useState(0)
  const [musicDuration, setMusicDuration] = useState(0)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [trackLabel, setTrackLabel] = useState(() => getPlaylist()[0]?.name ?? BUILTIN_PLAYLIST[0].name)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  function setupAnalyser(audio) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx()
      const ctx = audioCtxRef.current
      try { sourceRef.current?.disconnect() } catch {}
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 32
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
      sourceRef.current = source
      if (ctx.state === 'suspended') ctx.resume()
    } catch (e) {
      // analyser 初始化失败不影响音频播放
      console.warn('[audio] analyser 跳过:', e)
    }
  }

  function drawVisualizer() {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) { animRef.current = requestAnimationFrame(drawVisualizer); return }
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const bc = 32
    const bw = w / bc
    for (let i = 0; i < bc; i++) {
      const idx = i < 16 ? (data.length - 1 - i) : (i - 16)
      const bh = Math.max(1, (data[idx] / 255) * h)
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,182,193,0.4)' : 'rgba(255,107,157,0.35)'
      ctx.fillRect(i * bw + 0.5, h - bh, bw - 1, bh)
    }
    animRef.current = requestAnimationFrame(drawVisualizer)
  }

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawVisualizer)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  function playTrack(index) {
    const pl = getPlaylist()
    const file = pl[index]?.file ?? pl[0].file
    const src = file.startsWith('data:') ? file : encodeURI(file)
    const audio = new Audio(src)
    audio.volume = 0.1
    audio.preload = 'auto'

    const isDataUrl = file.startsWith('data:')
    audio.addEventListener('timeupdate', () => setMusicTime(audio.currentTime))
    audio.addEventListener('loadedmetadata', () => {
      setMusicDuration(audio.duration)
      if (!isDataUrl) setupAnalyser(audio)
    })
    audio.addEventListener('play', () => setMusicPlaying(true))
    audio.addEventListener('pause', () => setMusicPlaying(false))
    audio.addEventListener('ended', () => nextTrack())
    audio.addEventListener('error', (e) => {
      const msg = e.target?.error?.message || '未知错误'
      console.warn('[audio] 播放失败:', msg)
      setTimeout(() => nextTrack(), 1000)
    })

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    audio.play().catch(err => {
      console.warn('[audio] play() 失败:', err)
      setTimeout(() => nextTrack(), 1000)
    })
    audioRef.current = audio
    setCurrentTrack(index)
    setTrackLabel(pl[index]?.name ?? '')
    setMusicTime(0)
    setMusicDuration(0)
  }

  useEffect(() => {
    playTrack(0)
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 } }
  }, [])

  // 设置关闭后刷新当前曲目信息
  useEffect(() => {
    if (refreshKey === 0) return
    const pl = getPlaylist()
    if (currentTrack >= pl.length && pl.length > 0) {
      const next = currentTrack % pl.length
      setCurrentTrack(next)
      setTrackLabel(pl[next]?.name ?? '')
    } else {
      setTrackLabel(pl[currentTrack]?.name ?? '')
    }
  }, [refreshKey])

  function toggleMusic() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { a.play() } else { a.pause() }
  }

  function prevTrack() {
    const len = getPlaylist().length
    const prev = (currentTrack - 1 + len) % len
    playTrack(prev)
  }

  function nextTrack() {
    const len = getPlaylist().length
    const next = (currentTrack + 1) % len
    playTrack(next)
  }

  function seekMusic(e) {
    const a = audioRef.current
    if (!a || !musicDuration) return
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    a.currentTime = pct * musicDuration
    setMusicTime(a.currentTime)
  }

  const [leftWidth, setLeftWidth] = useState(300)
  const dragRef = useRef(null)

  const onResizeStart = useCallback((e) => {
    dragRef.current = { startX: e.clientX, startWidth: leftWidth }
    function onMove(e) {
      if (!dragRef.current) return
      const delta = e.clientX - dragRef.current.startX
      setLeftWidth(Math.max(220, Math.min(520, dragRef.current.startWidth + delta)))
    }
    function onUp() {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [leftWidth])

  function handleAdd(expense) {
    addExpense(expense)
    playSound()
    setSuccessExpense(expense)
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(handleCloseModal, 4000)
  }

  function handleCloseModal() {
    clearTimeout(closeTimerRef.current)
    quoteIndexRef.current += 1
    setSuccessExpense(null)
  }

  // Show piggy whenever user actively sets income
  function handleSetIncome(yearMonth, amount) {
    setIncomeForMonth(yearMonth, amount)
    if (amount > 0) {
      setPiggyIncome(amount)
      setShowPiggy(true)
    }
  }

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  function shiftMonth(ym, delta) {
    const [y, m] = ym.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  function formatMonthLabel(ym) {
    const [y, m] = ym.split('-').map(Number)
    return `${y}年${m}月`
  }

  const filteredExpenses = expenses.filter(e => {
    const matchMonth = e.date.startsWith(monthFilter)
    const matchCat = filter === 'all' || e.category === filter
    return matchMonth && matchCat
  })

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTotal = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0)

  const freshAvatar = users.find(u => u.id === user.id)?.avatar ?? user.avatar
  const showMusic = localStorage.getItem('et-show-music') !== 'false'

  return (
    <div className="app">
      {successExpense && (
        <SuccessModal
          expense={successExpense}
          quoteIndex={quoteIndexRef.current}
          onClose={handleCloseModal}
        />
      )}
      {showSettings && (
        <SettingsModal
          user={user}
          onUpdateAvatar={onUpdateAvatar}
          onUpdateUsername={onUpdateUsername}
          onUpdatePassword={onUpdatePassword}
          onClose={() => { setShowSettings(false); setRefreshKey(k => k + 1) }}
        />
      )}
      {showPiggy && piggyIncome > 0 && (
        <PiggyDialog
          income={piggyIncome}
          onGoToSavings={() => setTab('储蓄')}
          onClose={() => setShowPiggy(false)}
        />
      )}

      <header className="app-header">
        <div className="header-content">
          <span className="header-deco">🎀</span>
          <h1>Hello 记账</h1>
          <span className="month-total">本月 ¥{monthTotal.toFixed(2)}</span>
          <div className="header-user">
            <button
              className="header-avatar-btn"
              onClick={() => setShowSettings(true)}
              title="设置"
            >
              <UserAvatar avatar={freshAvatar} size={34} />
            </button>
            <span className="header-username">{user.username}</span>
            <button className="logout-btn" onClick={onLogout}>退出</button>
          </div>
        </div>

        {showMusic && (
        <div className="music-bar">
          <div className={`music-vinyl ${musicPlaying ? 'spinning' : ''}`}>
            <span>🎵</span>
          </div>
          <div className="music-controls">
            <button className="music-ctrl-btn" onClick={prevTrack} title="上一首">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <polygon points="16,5 8,12 16,19" />
                <rect x="7" y="5" width="2" height="14" rx="0.5" />
              </svg>
            </button>
            <button className="music-ctrl-btn music-play-btn" onClick={toggleMusic} title={musicPlaying ? '暂停' : '播放'}>
              {musicPlaying ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <rect x="7" y="4" width="3" height="16" rx="0.5" />
                  <rect x="14" y="4" width="3" height="16" rx="0.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <polygon points="7,4 19,12 7,20" />
                </svg>
              )}
            </button>
            <button className="music-ctrl-btn" onClick={nextTrack} title="下一首">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <polygon points="8,5 16,12 8,19" />
                <rect x="15" y="5" width="2" height="14" rx="0.5" />
              </svg>
            </button>
          </div>
          <div className="music-info">
            <span className="music-track-name">{trackLabel}</span>
            <div className="music-viz-progress">
              <canvas ref={canvasRef} className="music-viz-canvas" />
              <div className="music-progress-wrap" onMouseDown={seekMusic}>
                <div className="music-progress-bar">
                  <div
                    className="music-progress-fill"
                    style={{ width: musicDuration ? `${(musicTime / musicDuration) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === '记录' && (
          <div className="record-layout">
            <div className="record-left" style={{ width: leftWidth }}>
              <ExpenseForm categories={categories} onAdd={handleAdd} />
            </div>
            <div className="resize-handle" onMouseDown={onResizeStart} title="拖拽调整宽度">
              <span className="resize-dots" />
            </div>
            <div className="record-right">
              {showMonthPicker && (
                <MonthWheelPicker
                  value={monthFilter}
                  onChange={setMonthFilter}
                  onClose={() => setShowMonthPicker(false)}
                />
              )}
              <div className="list-header">
                <div className="list-header-left">
                  <h2>消费明细</h2>
                  <div className="month-nav">
                    <button className="month-nav-btn" onClick={() => setMonthFilter(shiftMonth(monthFilter, -1))}>‹</button>
                    <button className="month-nav-label" onClick={() => setShowMonthPicker(true)}>
                      {formatMonthLabel(monthFilter)}
                    </button>
                    <button className="month-nav-btn" onClick={() => setMonthFilter(shiftMonth(monthFilter, 1))}>›</button>
                  </div>
                </div>
                <select
                  className="filter-select"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option value="all">全部分类</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <ExpenseList key={`${monthFilter}-${filter}`} expenses={filteredExpenses} categories={categories} onDelete={deleteExpense} onEdit={editExpense} />
            </div>
          </div>
        )}

        {tab === '图表' && <Charts expenses={expenses} />}

        {tab === '预算' && (
          <BudgetPanel
            expenses={expenses}
            categories={categories}
            incomeByMonth={incomeByMonth}
            budgets={budgets}
            onSetIncome={handleSetIncome}
            onSetBudget={setCategoryBudget}
          />
        )}

        {tab === '储蓄' && (
          <SavingsPage
            savingsGoals={savingsGoals}
            monthlyIncome={monthlyIncome}
            onAdd={addSavingsGoal}
            onDelete={deleteSavingsGoal}
            onDeposit={depositToGoal}
          />
        )}

        {tab === '分类' && (
          <CategoryManager
            categories={categories}
            onAdd={addCategory}
            onDelete={deleteCategory}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  const { users, currentUser, login, register, updateUserAvatar, updateUsername, updatePassword, verifyPassword, deleteAccountById, logout } = useAuth()

  if (!currentUser) {
    return (
      <AuthScreen
        users={users}
        onLogin={login}
        onRegister={register}
        onUpdateAvatar={updateUserAvatar}
        onVerifyPassword={verifyPassword}
        onDeleteAccount={deleteAccountById}
      />
    )
  }

  return (
    <MainApp
      user={currentUser}
      users={users}
      onLogout={logout}
      onUpdateAvatar={updateUserAvatar}
      onUpdateUsername={updateUsername}
      onUpdatePassword={updatePassword}
    />
  )
}
