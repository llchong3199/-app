import { useState, useEffect } from 'react'
import { getCategoryIcon, getCategoryColor } from '../constants/categories'
import { MonthWheelPicker } from './DateWheelPicker'
import './BudgetPanel.css'

function shiftMonth(yearMonth, delta) {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(yearMonth) {
  const [y, m] = yearMonth.split('-')
  return `${y}年${parseInt(m)}月`
}

export function BudgetPanel({ expenses, categories, incomeByMonth, budgets, onSetIncome, onSetBudget }) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const monthlyIncome = incomeByMonth[selectedMonth] ?? 0
  const [incomeInput, setIncomeInput] = useState(monthlyIncome > 0 ? monthlyIncome.toString() : '')

  // Sync input when switching months
  useEffect(() => {
    const v = incomeByMonth[selectedMonth] ?? 0
    setIncomeInput(v > 0 ? v.toString() : '')
  }, [selectedMonth, incomeByMonth])

  const [budgetInputs, setBudgetInputs] = useState(() =>
    Object.fromEntries(categories.map(c => [c, budgets[c] > 0 ? budgets[c].toString() : '']))
  )

  useEffect(() => {
    setBudgetInputs(prev => {
      const next = { ...prev }
      categories.forEach(c => {
        if (!(c in next)) next[c] = budgets[c] > 0 ? budgets[c].toString() : ''
      })
      return next
    })
  }, [categories])

  const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth))

  const spendingByCategory = {}
  for (const e of monthExpenses) {
    spendingByCategory[e.category] = (spendingByCategory[e.category] ?? 0) + e.amount
  }

  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const balance = monthlyIncome > 0 ? monthlyIncome - totalSpent : null
  const incomeUsedPct = monthlyIncome > 0 ? Math.min(100, (totalSpent / monthlyIncome) * 100) : 0

  const totalBudgeted = categories.reduce((s, c) => {
    const live = parseFloat(budgetInputs[c])
    return s + (isNaN(live) || live < 0 ? (budgets[c] ?? 0) : live)
  }, 0)
  const remainingToAllocate = monthlyIncome > 0 ? monthlyIncome - totalBudgeted : null

  const isCurrentMonth = selectedMonth === currentMonth
  const isFutureMonth = selectedMonth > currentMonth
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  function handleIncomeSubmit(e) {
    e.preventDefault()
    const v = parseFloat(incomeInput)
    if (!isNaN(v) && v >= 0) onSetIncome(selectedMonth, v)
  }

  function handleBudgetBlur(cat) {
    const v = parseFloat(budgetInputs[cat])
    onSetBudget(cat, isNaN(v) || v < 0 ? 0 : v)
  }

  function handleBudgetReset(cat) {
    setBudgetInputs(prev => ({ ...prev, [cat]: '' }))
    onSetBudget(cat, 0)
  }

  return (
    <div className="budget-panel">
      {showMonthPicker && (
        <MonthWheelPicker
          value={selectedMonth}
          onChange={setSelectedMonth}
          onClose={() => setShowMonthPicker(false)}
        />
      )}

      {/* ── 收入卡片 ── */}
      <div className="budget-card">

        {/* 月份导航 */}
        <div className="month-nav">
          <button className="month-nav-btn" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}>‹</button>
          <button className="month-nav-label" onClick={() => setShowMonthPicker(true)}>
            {formatMonthLabel(selectedMonth)}
            {isCurrentMonth && <span className="month-nav-cur">本月</span>}
          </button>
          <button
            className="month-nav-btn"
            onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
            disabled={isCurrentMonth}
          >›</button>
        </div>

        <h3 className="budget-section-title">💰 收入</h3>
        <form className="income-form" onSubmit={handleIncomeSubmit}>
          <div className="income-input-row">
            <span className="income-prefix">¥</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={`${formatMonthLabel(selectedMonth)}收入`}
              value={incomeInput}
              onChange={e => setIncomeInput(e.target.value)}
            />
            <button type="submit">设置</button>
          </div>
        </form>

        {monthlyIncome > 0 && (
          <div className="income-summary">
            <div className="income-row">
              <span>{formatMonthLabel(selectedMonth)}收入</span>
              <span className="income-value">¥{monthlyIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="income-row">
              <span>当月支出</span>
              <span className="spent-value">¥{totalSpent.toFixed(2)}</span>
            </div>
            <div className="income-divider" />
            <div className="income-row">
              <span>剩余结余</span>
              <span className={`balance-value${balance < 0 ? ' over' : ''}`}>
                {balance < 0 ? '-' : ''}¥{Math.abs(balance).toFixed(2)}
              </span>
            </div>
            <div className="income-progress-track">
              <div
                className={`income-progress-bar${incomeUsedPct >= 100 ? ' over' : ''}`}
                style={{ width: `${incomeUsedPct}%` }}
              />
            </div>
            <div className="income-progress-label">已用收入的 {incomeUsedPct.toFixed(1)}%</div>
          </div>
        )}

        {monthlyIncome > 0 && (
          <div className="allocation-summary">
            <div className="allocation-row">
              <span>已分配预算</span>
              <span className="allocation-budgeted">¥{totalBudgeted.toFixed(2)}</span>
            </div>
            <div className="allocation-row">
              <span>尚未分配</span>
              <span className={`allocation-remain${remainingToAllocate < 0 ? ' over' : ''}`}>
                {remainingToAllocate < 0 ? '超出 -' : ''}¥{Math.abs(remainingToAllocate).toFixed(2)}
              </span>
            </div>
            {remainingToAllocate < 0 && (
              <div className="allocation-warn">⚠ 各分类预算总和超出月收入</div>
            )}
          </div>
        )}

        {/* 历史收入记录 */}
        {Object.keys(incomeByMonth).length > 1 && (
          <div className="income-history">
            <div className="income-history-title">历史收入</div>
            {Object.entries(incomeByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([ym, amt]) => (
                <div
                  key={ym}
                  className={`income-history-row${ym === selectedMonth ? ' active' : ''}`}
                  onClick={() => setSelectedMonth(ym)}
                >
                  <span>{formatMonthLabel(ym)}</span>
                  <span className="income-history-amt">¥{amt.toLocaleString()}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── 分类预算卡片 ── */}
      <div className="budget-card">
        <h3 className="budget-section-title">📊 分类预算额度</h3>
        {monthlyIncome > 0 && remainingToAllocate >= 0 && (
          <div className="budget-remain-banner">
            💡 还可分配 <strong>¥{remainingToAllocate.toFixed(2)}</strong>
          </div>
        )}
        <p className="budget-tip">失焦自动保存，支持随时修改</p>
        <div className="budget-list">
          {categories.map(cat => {
            const spent = spendingByCategory[cat] ?? 0
            const budget = budgets[cat] ?? 0
            const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
            const over = budget > 0 && spent > budget
            const color = getCategoryColor(cat) || '#FF6B9D'

            return (
              <div key={cat} className="budget-item">
                <div className="budget-item-header">
                  <span className="budget-cat-name">{getCategoryIcon(cat)} {cat}</span>
                  <div className="budget-input-wrap">
                    <span className="budget-input-prefix">¥</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="预算额度"
                      value={budgetInputs[cat] ?? ''}
                      onChange={e => setBudgetInputs(prev => ({ ...prev, [cat]: e.target.value }))}
                      onBlur={() => handleBudgetBlur(cat)}
                    />
                  </div>
                  {(budget > 0 || budgetInputs[cat]) && (
                    <button
                      type="button"
                      className="budget-reset-btn"
                      onClick={() => handleBudgetReset(cat)}
                      title="重置预算"
                    >重置</button>
                  )}
                </div>

                {budget > 0 && (
                  <>
                    <div className="budget-progress-track">
                      <div
                        className="budget-progress-fill"
                        style={{ width: `${pct}%`, background: over ? '#ef4444' : color }}
                      />
                    </div>
                    <div className="budget-item-foot">
                      <span className={over ? 'budget-over' : 'budget-spent'}>
                        {over ? '⚠ ' : ''}已花 ¥{spent.toFixed(2)}
                      </span>
                      <span className="budget-limit">上限 ¥{budget.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {budget === 0 && spent > 0 && (
                  <div className="budget-no-limit">当月已花 ¥{spent.toFixed(2)}（未设上限）</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
