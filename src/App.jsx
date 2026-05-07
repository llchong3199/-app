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

const PLAYLIST = [
  { name: 'Kiss The Rain', file: '/music/Kiss The Rain（淡淡伤感）.mp3' },
  { name: '風のように', file: '/music/S.E.N.S. - 風のように.mp3' },
  { name: '交界 (伴奏)', file: '/music/交界 (伴奏).mp3' },
  { name: '小野', file: '/music/山野煮雨 - 小野.mp3' },
  { name: '生命之名', file: '/music/神隱少女 - 生命之名.mp3' },
]

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
  const [piggyIncome, setPiggyIncome] = useState(0)
  const quoteIndexRef = useRef(0)
  const closeTimerRef = useRef(null)
  const playSound = useSuccessSound()

  const audioRef = useRef(null)
  const [musicPlaying, setMusicPlaying] = useState(true)
  const [musicTime, setMusicTime] = useState(0)
  const [musicDuration, setMusicDuration] = useState(0)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [trackLabel, setTrackLabel] = useState(PLAYLIST[0].name)

  function playTrack(index) {
    const src = encodeURI(PLAYLIST[index].file)
    const audio = new Audio(src)
    audio.volume = 0.2
    audio.preload = 'auto'

    audio.addEventListener('timeupdate', () => setMusicTime(audio.currentTime))
    audio.addEventListener('loadedmetadata', () => setMusicDuration(audio.duration))
    audio.addEventListener('play', () => setMusicPlaying(true))
    audio.addEventListener('pause', () => setMusicPlaying(false))
    audio.addEventListener('ended', () => nextTrack())

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    audio.play().catch(err => console.warn('[audio]', err))
    audioRef.current = audio
    setCurrentTrack(index)
    setTrackLabel(PLAYLIST[index].name)
    setMusicTime(0)
    setMusicDuration(0)
  }

  useEffect(() => {
    playTrack(0)
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 } }
  }, [])

  function toggleMusic() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { a.play() } else { a.pause() }
  }

  function prevTrack() {
    const prev = (currentTrack - 1 + PLAYLIST.length) % PLAYLIST.length
    playTrack(prev)
  }

  function nextTrack() {
    const next = (currentTrack + 1) % PLAYLIST.length
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
          onClose={() => setShowSettings(false)}
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
              <UserAvatar avatar={freshAvatar} size={28} />
            </button>
            <span className="header-username">{user.username}</span>
            <button className="logout-btn" onClick={onLogout}>退出</button>
          </div>
        </div>
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

        {/* ── 音乐播放器 ── */}
        <div className="music-bar">
          <div className={`music-vinyl ${musicPlaying ? 'spinning' : ''}`}>
            <span>🎵</span>
          </div>
          <div className="music-controls">
            <button className="music-ctrl-btn" onClick={prevTrack} title="上一首">⏮</button>
            <button className="music-ctrl-btn music-play-btn" onClick={toggleMusic} title={musicPlaying ? '暂停' : '播放'}>
              {musicPlaying ? '⏸' : '▶️'}
            </button>
            <button className="music-ctrl-btn" onClick={nextTrack} title="下一首">⏭</button>
          </div>
          <div className="music-info">
            <span className="music-track-name">{trackLabel}</span>
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
