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
import { AvatarPicker, UserAvatar } from './components/AvatarPicker'
import './App.css'

const TABS = ['记录', '图表', '预算', '储蓄', '分类']

function MainApp({ user, users, onLogout, onUpdateAvatar }) {
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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showPiggy, setShowPiggy] = useState(false)
  const [piggyIncome, setPiggyIncome] = useState(0)
  const quoteIndexRef = useRef(0)
  const closeTimerRef = useRef(null)
  const playSound = useSuccessSound()

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
      {showAvatarPicker && (
        <AvatarPicker
          onSelect={avatar => onUpdateAvatar(user.id, avatar)}
          onClose={() => setShowAvatarPicker(false)}
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
          <h1>消费记录</h1>
          <span className="month-total">本月 ¥{monthTotal.toFixed(2)}</span>
          <div className="header-user">
            <button
              className="header-avatar-btn"
              onClick={() => setShowAvatarPicker(true)}
              title="更换头像"
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
  const { users, currentUser, login, register, updateUserAvatar, verifyPassword, deleteAccountById, logout } = useAuth()

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
    />
  )
}
