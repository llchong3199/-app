import { useState } from 'react'
import { getCategoryColor } from '../constants/categories'
import { GoalCelebration } from './GoalCelebration'
import { MonthWheelPicker } from './DateWheelPicker'
import './SavingsPage.css'

const EMOJI_OPTIONS = [
  '💻','📱','✈️','🏠','🚗','👟','👗','📚','🎮','🎸',
  '💍','🏋️','🎓','🎁','🏖️','🎨','📷','🎵','🏡','💄',
  '🚴','🎯','🧳','🍽️','🎪','🛋️','🐾','🌱','⌚','🎹',
]

function formatMonthLabel(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return `${y}年${m}月`
}

function monthsUntil(targetYM) {
  const now = new Date()
  const [ty, tm] = targetYM.split('-').map(Number)
  const nowAbs = now.getFullYear() * 12 + now.getMonth() + 1
  const targetAbs = ty * 12 + tm
  return targetAbs - nowAbs
}

export function SavingsPage({ savingsGoals, monthlyIncome, onAdd, onDelete, onDeposit }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [depositingId, setDepositingId] = useState(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [celebGoal, setCelebGoal] = useState(null)
  const [newGoal, setNewGoal] = useState({ name: '', emoji: '💻', targetAmount: '', targetDate: '' })
  const [addError, setAddError] = useState('')
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false)

  const totalSaved  = savingsGoals.reduce((s, g) => s + g.savedAmount, 0)
  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0)
  const overallPct  = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0

  const monthlySuggest = monthlyIncome > 0 ? Math.round(monthlyIncome * 0.2) : 0

  function handleAddGoal(e) {
    e.preventDefault()
    const targetAmount = parseFloat(newGoal.targetAmount)
    if (!newGoal.name.trim()) { setAddError('请输入目标名称'); return }
    if (isNaN(targetAmount) || targetAmount <= 0) { setAddError('请输入有效金额'); return }
    const goal = { name: newGoal.name.trim(), emoji: newGoal.emoji, targetAmount }
    if (newGoal.targetDate) goal.targetDate = newGoal.targetDate
    onAdd(goal)
    setNewGoal({ name: '', emoji: '💻', targetAmount: '', targetDate: '' })
    setAddError('')
    setShowAddForm(false)
  }

  function handleDeposit(id) {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return
    const goal = savingsGoals.find(g => g.id === id)
    const willComplete = goal && (goal.savedAmount + amount) >= goal.targetAmount
    onDeposit(id, amount)
    setDepositAmount('')
    setDepositingId(null)
    if (willComplete) setCelebGoal(goal)
  }

  const currentYM = new Date().toISOString().slice(0, 7)

  return (
    <div className="savings-page">
      {celebGoal && (
        <GoalCelebration goal={celebGoal} onClose={() => setCelebGoal(null)} />
      )}

      {showTargetDatePicker && (
        <MonthWheelPicker
          value={newGoal.targetDate || currentYM}
          onChange={ym => setNewGoal(p => ({ ...p, targetDate: ym }))}
          onClose={() => setShowTargetDatePicker(false)}
        />
      )}

      {/* ── 总览卡片 ── */}
      {savingsGoals.length > 0 && (
        <div className="savings-summary">
          <div className="savings-summary-item">
            <span className="ss-label">总已存</span>
            <span className="ss-value">¥{totalSaved.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="ss-divider"/>
          <div className="savings-summary-item">
            <span className="ss-label">总目标</span>
            <span className="ss-value">¥{totalTarget.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="ss-divider"/>
          <div className="savings-summary-item">
            <span className="ss-label">整体进度</span>
            <span className="ss-value ss-pct">{overallPct.toFixed(1)}%</span>
          </div>
          {monthlyIncome > 0 && (
            <>
              <div className="ss-divider"/>
              <div className="savings-summary-item">
                <span className="ss-label">月存建议</span>
                <span className="ss-value ss-suggest">¥{monthlySuggest.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 顶部操作栏 ── */}
      <div className="savings-topbar">
        <h2 className="savings-title">🐷 储蓄目标</h2>
        {!showAddForm && (
          <button className="savings-add-btn" onClick={() => setShowAddForm(true)}>
            + 新增目标
          </button>
        )}
      </div>

      {/* ── 新增目标表单 ── */}
      {showAddForm && (
        <div className="savings-form-card">
          <div className="savings-form-heading">新增储蓄目标</div>

          <div className="emoji-grid">
            {EMOJI_OPTIONS.map(em => (
              <button
                key={em}
                type="button"
                className={`emoji-btn${newGoal.emoji === em ? ' selected' : ''}`}
                onClick={() => setNewGoal(p => ({ ...p, emoji: em }))}
              >{em}</button>
            ))}
          </div>

          <div className="savings-form-row">
            <input
              className="savings-input"
              placeholder="目标名称，例：买 MacBook Pro"
              value={newGoal.name}
              onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))}
            />
            <div className="savings-amount-wrap">
              <span className="savings-amount-prefix">¥</span>
              <input
                type="number"
                min="1"
                placeholder="目标金额"
                value={newGoal.targetAmount}
                onChange={e => setNewGoal(p => ({ ...p, targetAmount: e.target.value }))}
              />
            </div>
          </div>

          <button
            type="button"
            className="savings-date-trigger"
            onClick={() => setShowTargetDatePicker(true)}
          >
            <span>{newGoal.targetDate ? `📅 ${formatMonthLabel(newGoal.targetDate)} 达成` : '设置目标日期（可选）'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          {newGoal.targetDate && (
            <button
              type="button"
              className="savings-date-clear"
              onClick={() => setNewGoal(p => ({ ...p, targetDate: '' }))}
            >× 移除日期</button>
          )}

          {addError && <p className="savings-error">{addError}</p>}
          <div className="savings-form-actions">
            <button className="savings-cancel-btn" onClick={() => { setShowAddForm(false); setAddError('') }}>取消</button>
            <button className="savings-confirm-btn" onClick={handleAddGoal}>确认添加</button>
          </div>
        </div>
      )}

      {/* ── 空状态 ── */}
      {savingsGoals.length === 0 && !showAddForm && (
        <div className="savings-empty">
          <span className="savings-empty-icon">🐷</span>
          <p>还没有储蓄目标</p>
          <p className="savings-empty-sub">设置一个目标，我帮你存钱！</p>
          <button className="savings-add-btn" style={{ marginTop: 16 }} onClick={() => setShowAddForm(true)}>
            + 添加第一个目标
          </button>
        </div>
      )}

      {/* ── 目标卡片网格 ── */}
      <div className="savings-grid">
        {savingsGoals.map(goal => {
          const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0
          const gap = Math.max(0, goal.targetAmount - goal.savedAmount)
          const completed = goal.savedAmount >= goal.targetAmount

          // Target date recommendation
          const hasDeadline = !completed && goal.targetDate
          const monthsLeft = hasDeadline ? monthsUntil(goal.targetDate) : null
          const deadlineRecommend = hasDeadline && monthsLeft > 0
            ? Math.ceil(gap / monthsLeft)
            : null
          const isOverdue = hasDeadline && monthsLeft !== null && monthsLeft <= 0

          // Generic recommend (20% income)
          const monthsNeeded = monthlySuggest > 0 && gap > 0 ? Math.ceil(gap / monthlySuggest) : null

          return (
            <div key={goal.id} className={`goal-card${completed ? ' completed' : ''}`}>
              <div className="goal-emoji">{goal.emoji}</div>
              <div className="goal-name">{goal.name}</div>

              {completed && <div className="goal-done">🎉 目标达成！</div>}

              {/* progress */}
              <div className="goal-bar-track">
                <div
                  className="goal-bar-fill"
                  style={{ width: `${pct}%`, background: completed ? 'linear-gradient(90deg,#22c55e,#86efac)' : 'linear-gradient(90deg,var(--gold-primary),var(--gold-copper))' }}
                />
              </div>
              <div className="goal-pct-label">{pct.toFixed(1)}%</div>

              {/* amounts grid */}
              <div className="goal-amounts">
                <div className="goal-amount-cell">
                  <span className="gac-label">已存</span>
                  <span className="gac-value saved">¥{goal.savedAmount.toLocaleString()}</span>
                </div>
                <div className="goal-amount-cell">
                  <span className="gac-label">目标</span>
                  <span className="gac-value target">¥{goal.targetAmount.toLocaleString()}</span>
                </div>
                <div className="goal-amount-cell">
                  <span className="gac-label">差距</span>
                  <span className={`gac-value${completed ? ' done' : ' gap'}`}>
                    {completed ? '已完成' : `¥${gap.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Deadline-based recommendation (priority) */}
              {hasDeadline && !isOverdue && deadlineRecommend && (
                <div className="goal-estimate deadline">
                  📅 {formatMonthLabel(goal.targetDate)} 达成 · 还剩&nbsp;<strong>{monthsLeft} 个月</strong><br/>
                  建议每月存&nbsp;<strong>¥{deadlineRecommend.toLocaleString()}</strong>
                </div>
              )}
              {hasDeadline && isOverdue && (
                <div className="goal-estimate overdue">
                  ⚠️ 已超出计划时间（{formatMonthLabel(goal.targetDate)}）<br/>
                  继续加油，还差 ¥{gap.toLocaleString()}
                </div>
              )}

              {/* Generic recommendation (when no deadline) */}
              {!hasDeadline && monthsNeeded && !completed && (
                <div className="goal-estimate">
                  💡 月存 ¥{monthlySuggest.toLocaleString()}（收入20%），约&nbsp;<strong>{monthsNeeded} 个月</strong>后达成
                </div>
              )}
              {!hasDeadline && !monthlyIncome && !completed && (
                <div className="goal-estimate hint">设置月收入后可查看预计存款时间</div>
              )}

              {/* deposit / actions */}
              {depositingId === goal.id ? (
                <div className="goal-deposit-form">
                  <div className="goal-deposit-row">
                    <span className="gdp">¥</span>
                    <input
                      type="number"
                      min="0.01"
                      placeholder="本次存入金额"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleDeposit(goal.id)}
                    />
                  </div>
                  <div className="goal-deposit-btns">
                    <button className="gdb-cancel" onClick={() => { setDepositingId(null); setDepositAmount('') }}>取消</button>
                    <button className="gdb-confirm" onClick={() => handleDeposit(goal.id)}>确认存入</button>
                  </div>
                </div>
              ) : (
                <div className="goal-card-actions">
                  {!completed && (
                    <button className="gca-deposit" onClick={() => setDepositingId(goal.id)}>
                      🪙 存入
                    </button>
                  )}
                  <button className="gca-delete" onClick={() => onDelete(goal.id)}>删除</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
