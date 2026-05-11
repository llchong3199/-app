import { useState, useEffect, useRef } from 'react'
import { getCategoryIcon, getCategoryColor } from '../constants/categories'
import { MonthWheelPicker } from './DateWheelPicker'
import './BudgetPanel.css'

const FIXED_EMOJI_OPTIONS = [
  '🏠','💡','💧','🔥','📱','🌐','🚗','💊','🎵','☕',
  '🍕','🎓','🛡️','📺','💳','🏋️','🐾','📦','🔑','🚿',
]

const MIN_BUDGET_H  = 200
const MIN_FIXED_H   = 100
const HANDLE_H      = 16
const DEFAULT_TOTAL_H  = 620
const DEFAULT_BUDGET_H = 400
const MIN_TOTAL_H   = 320

function shiftMonth(yearMonth, delta) {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(yearMonth) {
  const [y, m] = yearMonth.split('-')
  return `${y}年${parseInt(m)}月`
}

export function BudgetPanel({ expenses, categories, incomeByMonth, budgets, onSetIncome, onSetBudget, fixedExpenses, onAddFixedExpense, onDeleteFixedExpense }) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const monthlyIncome = incomeByMonth[selectedMonth] ?? 0
  const [incomeInput, setIncomeInput] = useState(monthlyIncome > 0 ? monthlyIncome.toString() : '')

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

  // ── 固定开销 state ──
  const [showFixedForm, setShowFixedForm] = useState(false)
  const [newFixed, setNewFixed] = useState({ name: '', emoji: '🏠', amount: '' })
  const [fixedError, setFixedError] = useState('')

  // ── 高度 state ──
  const [totalHeight, setTotalHeight]   = useState(DEFAULT_TOTAL_H)
  const [budgetHeight, setBudgetHeight] = useState(DEFAULT_BUDGET_H)

  const fixedPaneH = Math.max(MIN_FIXED_H, totalHeight - budgetHeight - HANDLE_H)

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

  const totalFixed = fixedExpenses.reduce((s, f) => s + f.amount, 0)
  const remainingToAllocate = monthlyIncome > 0 ? monthlyIncome - totalFixed - totalBudgeted : null

  const isCurrentMonth = selectedMonth === currentMonth
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

  function handleAddFixed() {
    const amount = parseFloat(newFixed.amount)
    if (!newFixed.name.trim()) { setFixedError('请输入名称'); return }
    if (isNaN(amount) || amount <= 0) { setFixedError('请输入有效金额'); return }
    onAddFixedExpense({ name: newFixed.name.trim(), emoji: newFixed.emoji, amount })
    setNewFixed({ name: '', emoji: '🏠', amount: '' })
    setFixedError('')
    setShowFixedForm(false)
  }

  // ── 中间拖拽（分类预算 / 固定开销 分隔）──
  function onMidResizeStart(e) {
    e.preventDefault()
    const startY = e.clientY ?? e.touches?.[0]?.clientY
    const startH = budgetHeight
    const maxH = totalHeight - HANDLE_H - MIN_FIXED_H
    function onMove(ev) {
      const y = ev.clientY ?? ev.touches?.[0]?.clientY
      setBudgetHeight(Math.max(MIN_BUDGET_H, Math.min(maxH, startH + y - startY)))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  // ── 底部拖拽（整体高度）──
  function onBottomResizeStart(e) {
    e.preventDefault()
    const startY = e.clientY ?? e.touches?.[0]?.clientY
    const startTotal = totalHeight
    function onMove(ev) {
      const y = ev.clientY ?? ev.touches?.[0]?.clientY
      const newTotal = Math.max(MIN_TOTAL_H, startTotal + y - startY)
      setTotalHeight(newTotal)
      setBudgetHeight(prev => Math.min(prev, newTotal - HANDLE_H - MIN_FIXED_H))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const fixedContent = (
    <>
      <h3 className="budget-section-title">📌 固定开销</h3>
      <p className="budget-tip">房租、贷款还款、订阅服务等每月必须支出</p>

      <div className="fixed-expense-list">
        {fixedExpenses.length === 0 && !showFixedForm && (
          <div className="fixed-expense-empty">暂无固定开销记录</div>
        )}
        {fixedExpenses.map(fe => (
          <div key={fe.id} className="fixed-expense-item">
            <span className="fixed-expense-icon">{fe.emoji}</span>
            <span className="fixed-expense-name">
              {fe.name}
              {fe.fromLoan && <span className="fixed-loan-tag">贷款</span>}
            </span>
            <span className="fixed-expense-amount">
              ¥{fe.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              <span className="fixed-per-month">/月</span>
            </span>
            {fe.fromLoan ? (
              <span className="fixed-expense-locked" title="贷款还清后自动移除">🔒</span>
            ) : (
              <button
                className="fixed-expense-del"
                onClick={() => onDeleteFixedExpense(fe.id)}
                title="删除"
              >×</button>
            )}
          </div>
        ))}
        {fixedExpenses.length > 0 && (
          <div className="fixed-total-row">
            <span>每月固定合计</span>
            <span className="fixed-total-val">¥{totalFixed.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}/月</span>
          </div>
        )}
      </div>

      {showFixedForm ? (
        <div className="fixed-add-form">
          <div className="fixed-emoji-row">
            {FIXED_EMOJI_OPTIONS.map(em => (
              <button
                key={em}
                type="button"
                className={`fixed-emoji-btn${newFixed.emoji === em ? ' selected' : ''}`}
                onClick={() => setNewFixed(p => ({ ...p, emoji: em }))}
              >{em}</button>
            ))}
          </div>
          <div className="fixed-form-inputs">
            <input
              className="fixed-text-input"
              placeholder="名称，例：房租、网费、视频会员"
              value={newFixed.name}
              onChange={e => setNewFixed(p => ({ ...p, name: e.target.value }))}
            />
            <div className="fixed-amount-input">
              <span className="fixed-amount-prefix">¥</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="每月金额"
                value={newFixed.amount}
                onChange={e => setNewFixed(p => ({ ...p, amount: e.target.value }))}
              />
              <span className="fixed-per-month-label">/月</span>
            </div>
          </div>
          {fixedError && <p className="fixed-error">{fixedError}</p>}
          <div className="fixed-form-actions">
            <button className="fixed-cancel-btn" onClick={() => { setShowFixedForm(false); setFixedError('') }}>取消</button>
            <button className="fixed-confirm-btn" onClick={handleAddFixed}>确认添加</button>
          </div>
        </div>
      ) : (
        <button className="fixed-add-trigger" onClick={() => setShowFixedForm(true)}>
          + 添加固定开销
        </button>
      )}
    </>
  )

  return (
    <div className="budget-panel-wrap">
      {showMonthPicker && (
        <MonthWheelPicker
          value={selectedMonth}
          onChange={setSelectedMonth}
          onClose={() => setShowMonthPicker(false)}
        />
      )}

      <div className="budget-panel" style={{ height: totalHeight }}>
        {/* ── 收入卡片（左列）── */}
        <div className="budget-card budget-income-col" style={{ height: totalHeight }}>
          <div className="month-nav">
            <button className="month-nav-btn" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}>‹</button>
            <button className="month-nav-label" onClick={() => setShowMonthPicker(true)}>
              {formatMonthLabel(selectedMonth)}
              {isCurrentMonth && <span className="month-nav-cur">本月</span>}
            </button>
            <button
              className="month-nav-btn"
              onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
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
              {totalFixed > 0 && (
                <div className="allocation-row">
                  <span>固定开销</span>
                  <span className="allocation-fixed">¥{totalFixed.toFixed(2)}/月</span>
                </div>
              )}
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
                <div className="allocation-warn">
                  ⚠ {totalFixed > 0 ? '固定开销与各分类预算合计超出月收入' : '各分类预算总和超出月收入'}
                </div>
              )}
            </div>
          )}

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

        {/* ── 右列：分类预算 + 固定开销 ── */}
        <div className="budget-right-col" style={{ height: totalHeight }}>
          {/* 分类预算面板 */}
          <div className="budget-card budget-budget-pane" style={{ height: budgetHeight }}>
            <h3 className="budget-section-title">📊 分类预算额度</h3>
            {monthlyIncome > 0 && remainingToAllocate >= 0 && (
              <div className="budget-remain-banner">
                💡 还可分配 <strong>¥{remainingToAllocate.toFixed(2)}</strong>
              </div>
            )}
            <p className="budget-tip">失焦自动保存，支持随时修改</p>
            <div className="budget-list">
              {categories.map(cat => {
                const spent  = spendingByCategory[cat] ?? 0
                const budget = budgets[cat] ?? 0
                const pct    = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
                const over   = budget > 0 && spent > budget
                const color  = getCategoryColor(cat) || '#FF6B9D'

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

          {/* 中间拖拽手柄 */}
          <div
            className="budget-vresize-handle"
            onMouseDown={onMidResizeStart}
            onTouchStart={onMidResizeStart}
          >
            <span className="budget-vresize-dots" />
          </div>

          {/* 固定开销面板 */}
          <div className="budget-card budget-fixed-pane" style={{ height: fixedPaneH }}>
            {fixedContent}
          </div>
        </div>
      </div>

      {/* ── 底部拖拽手柄（调整总高度）── */}
      <div
        className="budget-bottom-handle"
        onMouseDown={onBottomResizeStart}
        onTouchStart={onBottomResizeStart}
      >
        <span className="budget-bottom-dots" />
      </div>
    </div>
  )
}
