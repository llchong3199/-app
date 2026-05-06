import { useState, useRef, useEffect } from 'react'
import { useExpenses } from './hooks/useExpenses'
import { useSuccessSound } from './hooks/useSuccessSound'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { Charts } from './components/Charts'
import { CategoryManager } from './components/CategoryManager'
import { SuccessModal } from './components/SuccessModal'
import './App.css'

const TABS = ['记录', '图表', '分类']

export default function App() {
  const { expenses, categories, addExpense, deleteExpense, addCategory, deleteCategory } = useExpenses()
  const [tab, setTab] = useState('记录')
  const [filter, setFilter] = useState('all')
  const [successExpense, setSuccessExpense] = useState(null)
  const quoteIndexRef = useRef(0)
  const closeTimerRef = useRef(null)
  const playSound = useSuccessSound()

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

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  const filteredExpenses = filter === 'all'
    ? expenses
    : expenses.filter(e => e.category === filter)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthTotal = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0)

  return (
    <div className="app">
      {successExpense && (
        <SuccessModal
          expense={successExpense}
          quoteIndex={quoteIndexRef.current}
          onClose={handleCloseModal}
        />
      )}
      <header className="app-header">
        <div className="header-content">
          <h1>消费记录</h1>
          <span className="month-total">本月 ¥{monthTotal.toFixed(2)}</span>
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
          <>
            <ExpenseForm categories={categories} onAdd={handleAdd} />
            <div className="list-header">
              <h2>消费明细</h2>
              <select
                className="filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">全部分类</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <ExpenseList expenses={filteredExpenses} onDelete={deleteExpense} />
          </>
        )}

        {tab === '图表' && <Charts expenses={expenses} />}

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
