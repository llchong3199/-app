import { useState, useEffect, useRef } from 'react'
import { GoalCelebration } from './GoalCelebration'
import { MonthWheelPicker } from './DateWheelPicker'
import { useFreeLayout, findFreePosition } from '../hooks/useFreeLayout'
import './SavingsPage.css'

function AnimatedNum({ value, prefix = '', suffix = '', decimals = 2 }) {
  const [display, setDisplay] = useState(value)
  const targetRef = useRef(value)

  useEffect(() => {
    if (targetRef.current === value) return
    const prevTarget = targetRef.current
    targetRef.current = value

    const start = display
    const diff = value - start
    if (Math.abs(diff) < 0.001) { setDisplay(value); return }

    const duration = 400
    const t0 = performance.now()
    let raf
    function tick(now) {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(start + diff * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  const formatted = prefix + display.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  return <>{formatted}</>
}

const EMOJI_OPTIONS = [
  '💻','📱','✈️','🏠','🚗','👟','👗','📚','🎮','🎸',
  '💍','🏋️','🎓','🎁','🏖️','🎨','📷','🎵','🏡','💄',
  '🚴','🎯','🧳','🍽️','🎪','🛋️','🐾','🌱','⌚','🎹',
]

const LOAN_EMOJI_OPTIONS = [
  '🏠','🚗','💻','📱','🎓','💳','🏥','✈️','🛋️','💍',
  '🏋️','📚','🎸','⌚','🎯','🌱','🏖️','🎨','📷','💡',
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

function monthsBetween(startYM, endYM) {
  const [sy, sm] = startYM.split('-').map(Number)
  const [ey, em] = endYM.split('-').map(Number)
  return (ey - sy) * 12 + (em - sm)
}

const DEFAULT_W = 300
const DEFAULT_H = 310
const MIN_W = 220
const MIN_H = 230
const GRID_GAP = 16
const COLS = 3
const SNAP_THRESHOLD = 5

function defaultLayout(index) {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return { x: col * (DEFAULT_W + GRID_GAP), y: row * (DEFAULT_H + GRID_GAP), w: DEFAULT_W, h: DEFAULT_H }
}

function computeRowSnapX(rawX, dragId, dragLayout, allLayouts, canvasW, threshold) {
  const others = Object.entries(allLayouts)
    .filter(([k]) => k !== dragId)
    .map(([, l]) => l)
  // 找出与拖拽卡片 y 范围有交集的同排卡片
  const rowCards = others.filter(l => {
    const overlap = !(dragLayout.y + dragLayout.h <= l.y || dragLayout.y >= l.y + l.h)
    return overlap
  })
  // 没有同排卡片时 fallback 到网格吸附
  if (rowCards.length === 0) return null
  rowCards.sort((a, b) => a.x - b.x)
  const gaps = []
  const w = dragLayout.w
  // 最左边
  if (rowCards[0].x >= w + GRID_GAP) gaps.push(0)
  // 卡片之间
  for (let i = 0; i < rowCards.length - 1; i++) {
    const gapStart = rowCards[i].x + rowCards[i].w + GRID_GAP
    const gapEnd = rowCards[i + 1].x
    if (gapEnd - gapStart >= w) gaps.push(gapStart)
  }
  // 最右边
  const lastEnd = rowCards[rowCards.length - 1].x + rowCards[rowCards.length - 1].w + GRID_GAP
  if (canvasW - lastEnd >= w) gaps.push(lastEnd)
  if (gaps.length === 0) return null
  // 找最近的间隙
  let best = gaps[0], bestDist = Math.abs(rawX - gaps[0])
  for (let i = 1; i < gaps.length; i++) {
    const d = Math.abs(rawX - gaps[i])
    if (d < bestDist) { bestDist = d; best = gaps[i] }
  }
  return bestDist <= threshold ? best : null
}

export function SavingsPage({ savingsGoals, monthlyIncome, onAdd, onDelete, onDeposit, loans, onAddLoan, onDeleteLoan, onPayLoan }) {
  const [activeTab, setActiveTab] = useState('savings')

  const [activeCard, setActiveCard] = useState(null)

  // ── 储蓄目标自由布局 ──
  const { layouts, setLayouts, canvasRef, getLayout, ensureSaved } = useFreeLayout('savings-card-layouts', savingsGoals)

  function onCardDragStart(e, id, index) {
    if (e.target.closest('button, input')) return
    e.preventDefault()
    ensureSaved(id, index)
    setActiveCard(id)
    const layout = getLayout(id, index)
    // pageX/Y = clientX/Y + scrollY，用文档坐标避免滚动偏差
    const canvasEl = canvasRef.current
    const canvasRect = canvasEl ? canvasEl.getBoundingClientRect() : { left: 0, top: 0 }
    const canvasPageLeft = canvasRect.left + window.scrollX
    const canvasPageTop  = canvasRect.top  + window.scrollY
    const ox = e.pageX - canvasPageLeft - layout.x
    const oy = e.pageY - canvasPageTop  - layout.y
    function onMove(ev) {
      const rawX = Math.max(0, ev.pageX - canvasPageLeft - ox)
      const rawY = Math.max(0, ev.pageY - canvasPageTop  - oy)
      const el = canvasRef.current
      const canvasW = el ? el.offsetWidth : 900
      setLayouts(prev => {
        const cur = prev[id] || defaultLayout(index)
        // 同排间隙吸附优先
        const rowX = computeRowSnapX(rawX, id, cur, prev, canvasW, SNAP_THRESHOLD * 3)
        let x
        if (rowX !== null) {
          x = rowX
        } else {
          // fallback：网格吸附
          const cellW = cur.w + GRID_GAP
          const snapGX = Math.round(rawX / cellW) * cellW
          x = Math.abs(rawX - snapGX) < SNAP_THRESHOLD ? snapGX : rawX
        }
        // 钳制 x 不超出画布右边界
        x = Math.min(Math.max(0, x), Math.max(0, canvasW - cur.w))
        // 纵向只做网格吸附，不做中心吸附
        const cellH = cur.h + GRID_GAP
        const snapGY = Math.round(rawY / cellH) * cellH
        const y = Math.max(0, Math.abs(rawY - snapGY) < SNAP_THRESHOLD ? snapGY : rawY)
        return { ...prev, [id]: { x, y, w: cur.w, h: cur.h } }
      })
    }
    function onUp() {
      setActiveCard(null)
      // 放下时检测重叠，有重叠则弹去空位（含未保存布局的卡片用 defaultLayout 兜底）
      setLayouts(prev => {
        const cur = prev[id]
        if (!cur) return prev
        const others = {}
        savingsGoals.forEach((g, i) => {
          if (g.id !== id) others[g.id] = prev[g.id] || defaultLayout(i)
        })
        const overlaps = Object.values(others).some(l =>
          cur.x < l.x + l.w && cur.x + cur.w > l.x &&
          cur.y < l.y + l.h && cur.y + cur.h > l.y
        )
        if (overlaps) return { ...prev, [id]: findFreePosition(cur.w, cur.h, others) }
        return prev
      })
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onCardResizeStart(e, id, index) {
    e.preventDefault()
    e.stopPropagation()
    ensureSaved(id, index)
    setActiveCard(id)
    const layout = getLayout(id, index)
    const sx = e.clientX, sy = e.clientY
    const sw = layout.w, sh = layout.h
    function onMove(ev) {
      const canvasW = canvasRef.current?.offsetWidth || 900
      setLayouts(prev => {
        const cur = prev[id] || defaultLayout(index)
        const rawW = Math.max(MIN_W, sw + ev.clientX - sx)
        const newH = Math.max(MIN_H, sh + ev.clientY - sy)
        // 画布右边界硬限制（左侧不能出界，右侧跟着走）
        const newW = Math.min(rawW, canvasW - cur.x)
        // 不覆盖右侧卡片：只有起点超过当前右边缘的卡片才限制宽度增长
        // 不覆盖下方卡片：只有起点超过当前下边缘的卡片才限制高度增长
        let maxW = newW, maxH = newH
        Object.entries(prev).forEach(([k, l]) => {
          if (k === id) return
          if (l.x >= cur.x + cur.w && l.y < cur.y + newH && l.y + l.h > cur.y)
            maxW = Math.min(maxW, l.x - cur.x - 2)
          if (l.y >= cur.y + cur.h && l.x < cur.x + newW && l.x + l.w > cur.x)
            maxH = Math.min(maxH, l.y - cur.y - 2)
        })
        return { ...prev, [id]: { x: cur.x, y: cur.y, w: Math.max(MIN_W, maxW), h: Math.max(MIN_H, maxH) } }
      })
    }
    function onUp() {
      setActiveCard(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onCardResizeLeftStart(e, id, index) {
    e.preventDefault()
    e.stopPropagation()
    ensureSaved(id, index)
    setActiveCard(id)
    const layout = getLayout(id, index)
    const sx = e.clientX, sy = e.clientY
    const sw = layout.w, sh = layout.h, sx0 = layout.x
    function onMove(ev) {
      setLayouts(prev => {
        const cur = prev[id] || defaultLayout(index)
        const dx = sx - ev.clientX
        const rawW = Math.max(MIN_W, sw + dx)
        const newH = Math.max(MIN_H, sh + ev.clientY - sy)
        const rawX = sx0 - dx
        const x = Math.max(0, rawX)
        const w = rawX < 0 ? rawW + rawX : rawW
        let maxW = w, maxH = newH
        Object.entries(prev).forEach(([k, l]) => {
          if (k === id) return
          if (l.x + l.w > x && l.x < x + w && l.y < cur.y + maxH && l.y + l.h > cur.y)
            maxW = Math.min(maxW, l.x - x - 2)
          if (l.y >= cur.y + cur.h && l.x < x + maxW && l.x + l.w > x)
            maxH = Math.min(maxH, l.y - cur.y - 2)
        })
        return { ...prev, [id]: { x, y: cur.y, w: Math.max(MIN_W, maxW), h: Math.max(MIN_H, maxH) } }
      })
    }
    function onUp() {
      setActiveCard(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── 储蓄目标 state ──
  const [showAddForm, setShowAddForm] = useState(false)
  const [depositingId, setDepositingId] = useState(null)
  const [resetKey, setResetKey] = useState(0)
  const [flippedId, setFlippedId] = useState(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [celebGoal, setCelebGoal] = useState(null)
  const [newGoal, setNewGoal] = useState({ name: '', emoji: '💻', targetAmount: '', targetDate: '' })
  const [addError, setAddError] = useState('')
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false)

  // ── 贷款 state ──
  const [showAddLoanForm, setShowAddLoanForm] = useState(false)
  const [newLoan, setNewLoan] = useState({ name: '', emoji: '🏠', totalAmount: '', monthlyPayment: '', startDate: '', endDate: '' })
  const [addLoanError, setAddLoanError] = useState('')
  const [payingLoanId, setPayingLoanId] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [showLoanDatePicker, setShowLoanDatePicker] = useState(null) // 'start' | 'end' | null
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type: 'goal'|'loan', id, name, emoji }

  // ── 贷款自由布局 ──
  const { layouts: loanLayouts, setLayouts: setLoanLayouts, canvasRef: loanCanvasRef, getLayout: getLoanLayout, ensureSaved: ensureLoanSaved } = useFreeLayout('loan-card-layouts', loans)

  // ── 储蓄目标汇总（进行中目标单独统计）──
  const activeGoals    = savingsGoals.filter(g => g.savedAmount < g.targetAmount)
  const completedCount = savingsGoals.length - activeGoals.length
  const totalSaved     = activeGoals.reduce((s, g) => s + g.savedAmount, 0)
  const totalTarget    = activeGoals.reduce((s, g) => s + g.targetAmount, 0)
  const overallPct     = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0
  const monthlySuggest = monthlyIncome > 0 ? Math.round(monthlyIncome * 0.2) : 0

  const TABS = ['savings', 'loans']
  function switchTab(dir) {
    const idx = TABS.indexOf(activeTab)
    setActiveTab(TABS[(idx + dir + TABS.length) % TABS.length])
  }

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') switchTab(-1)
      if (e.key === 'ArrowRight') switchTab(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTab])

  // ── 贷款汇总 ──
  const totalDebt          = loans.reduce((s, l) => s + l.totalAmount, 0)
  const totalPaid          = loans.reduce((s, l) => s + l.paidAmount, 0)
  const totalRemaining     = totalDebt - totalPaid
  const totalMonthlyPayment = loans.reduce((s, l) => s + l.monthlyPayment, 0)
  const activeLoans = loans.filter(l => l.paidAmount < l.totalAmount)
  const paidLoans   = loans.filter(l => l.paidAmount >= l.totalAmount)

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

  function handleAddLoan(e) {
    e.preventDefault()
    const totalAmount    = parseFloat(newLoan.totalAmount)
    const monthlyPayment = parseFloat(newLoan.monthlyPayment)
    if (!newLoan.name.trim()) { setAddLoanError('请输入贷款名称'); return }
    if (isNaN(totalAmount) || totalAmount <= 0) { setAddLoanError('请输入有效贷款金额'); return }
    if (isNaN(monthlyPayment) || monthlyPayment <= 0) { setAddLoanError('请输入有效月还款额'); return }
    onAddLoan({
      name: newLoan.name.trim(), emoji: newLoan.emoji, totalAmount, monthlyPayment,
      startDate: newLoan.startDate || null, endDate: newLoan.endDate || null,
    })
    setNewLoan({ name: '', emoji: '🏠', totalAmount: '', monthlyPayment: '', startDate: '', endDate: '' })
    setAddLoanError('')
    setShowAddLoanForm(false)
  }

  function handlePayLoan(id) {
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) return
    onPayLoan(id, amount)
    setPayAmount('')
    setPayingLoanId(null)
  }

  // ── 贷款卡片拖拽 ──
  function onLoanCardDragStart(e, id, index) {
    if (e.target.closest('button, input')) return
    e.preventDefault()
    ensureLoanSaved(id, index)
    setActiveCard(id)
    const layout = getLoanLayout(id, index)
    const canvasEl = loanCanvasRef.current
    const canvasRect = canvasEl ? canvasEl.getBoundingClientRect() : { left: 0, top: 0 }
    const canvasPageLeft = canvasRect.left + window.scrollX
    const canvasPageTop  = canvasRect.top  + window.scrollY
    const ox = e.pageX - canvasPageLeft - layout.x
    const oy = e.pageY - canvasPageTop  - layout.y
    function onMove(ev) {
      const rawX = Math.max(0, ev.pageX - canvasPageLeft - ox)
      const rawY = Math.max(0, ev.pageY - canvasPageTop  - oy)
      const el = loanCanvasRef.current
      const canvasW = el ? el.offsetWidth : 900
      setLoanLayouts(prev => {
        const cur = prev[id] || defaultLayout(index)
        // 同排间隙吸附优先
        const rowX = computeRowSnapX(rawX, id, cur, prev, canvasW, SNAP_THRESHOLD * 3)
        let x
        if (rowX !== null) {
          x = rowX
        } else {
          const cellW = cur.w + GRID_GAP
          const snapGX = Math.round(rawX / cellW) * cellW
          x = Math.abs(rawX - snapGX) < SNAP_THRESHOLD ? snapGX : rawX
        }
        x = Math.min(Math.max(0, x), Math.max(0, canvasW - cur.w))
        const cellH = cur.h + GRID_GAP
        const snapGY = Math.round(rawY / cellH) * cellH
        const y = Math.max(0, Math.abs(rawY - snapGY) < SNAP_THRESHOLD ? snapGY : rawY)
        return { ...prev, [id]: { x, y, w: cur.w, h: cur.h } }
      })
    }
    function onUp() {
      setActiveCard(null)
      setLoanLayouts(prev => {
        const cur = prev[id]
        if (!cur) return prev
        const others = {}
        loans.forEach((l, i) => {
          if (l.id !== id) others[l.id] = prev[l.id] || defaultLayout(i)
        })
        const overlaps = Object.values(others).some(l =>
          cur.x < l.x + l.w && cur.x + cur.w > l.x &&
          cur.y < l.y + l.h && cur.y + cur.h > l.y
        )
        if (overlaps) return { ...prev, [id]: findFreePosition(cur.w, cur.h, others) }
        return prev
      })
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onLoanCardResizeStart(e, id, index) {
    e.preventDefault()
    e.stopPropagation()
    ensureLoanSaved(id, index)
    setActiveCard(id)
    const layout = getLoanLayout(id, index)
    const sx = e.clientX, sy = e.clientY
    const sw = layout.w, sh = layout.h
    function onMove(ev) {
      const canvasW = loanCanvasRef.current?.offsetWidth || 900
      setLoanLayouts(prev => {
        const cur = prev[id] || defaultLayout(index)
        const rawW = Math.max(MIN_W, sw + ev.clientX - sx)
        const newH = Math.max(MIN_H, sh + ev.clientY - sy)
        const newW = Math.min(rawW, canvasW - cur.x)
        let maxW = newW, maxH = newH
        Object.entries(prev).forEach(([k, l]) => {
          if (k === id) return
          if (l.x >= cur.x + cur.w && l.y < cur.y + newH && l.y + l.h > cur.y)
            maxW = Math.min(maxW, l.x - cur.x - 2)
          if (l.y >= cur.y + cur.h && l.x < cur.x + newW && l.x + l.w > cur.x)
            maxH = Math.min(maxH, l.y - cur.y - 2)
        })
        return { ...prev, [id]: { x: cur.x, y: cur.y, w: Math.max(MIN_W, maxW), h: Math.max(MIN_H, maxH) } }
      })
    }
    function onUp() {
      setActiveCard(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── 卡片翻转 ──
  function toggleFlip(id) {
    setFlippedId(prev => prev === id ? null : id)
  }

  function handleFrontClick(e, id) {
    if (e.target.closest('button, input, .goal-drag-handle, .goal-resize-handle')) return
    toggleFlip(id)
  }

  const currentYM = new Date().toISOString().slice(0, 7)

  function renderLoanCardBody(loan) {
    const pct             = loan.totalAmount > 0 ? Math.min(100, (loan.paidAmount / loan.totalAmount) * 100) : 0
    const remaining       = Math.max(0, loan.totalAmount - loan.paidAmount)
    const paid            = loan.paidAmount >= loan.totalAmount
    const remainingMonths = paid ? 0 : Math.ceil(remaining / loan.monthlyPayment)

    return (
      <>
        {paid && <div className="goal-done loan-done">🎉 贷款还清！</div>}

        {(loan.startDate || loan.endDate) && (
          <div className="loan-date-range">
            <span>{loan.startDate ? formatMonthLabel(loan.startDate) : '—'}</span>
            <span className="loan-date-arrow">→</span>
            <span>{loan.endDate ? formatMonthLabel(loan.endDate) : '—'}</span>
            {loan.startDate && loan.endDate && monthsBetween(loan.startDate, loan.endDate) > 0 && (
              <span className="loan-duration">共 {monthsBetween(loan.startDate, loan.endDate)} 个月</span>
            )}
          </div>
        )}

        <div className="goal-bar-track">
          <div
            className="goal-bar-fill"
            style={{
              width: `${pct}%`,
              background: paid
                ? 'linear-gradient(90deg,#22c55e,#86efac)'
                : 'linear-gradient(90deg,#f472b6,#c084fc)',
            }}
          />
        </div>
        <div className="goal-pct-label">已还 {pct.toFixed(1)}%</div>

        <div className="goal-amounts">
          <div className="goal-amount-cell">
            <span className="gac-label">已还</span>
            <span className="gac-value saved loan-paid">¥{loan.paidAmount.toLocaleString()}</span>
          </div>
          <div className="goal-amount-cell">
            <span className="gac-label">总额</span>
            <span className="gac-value target">¥{loan.totalAmount.toLocaleString()}</span>
          </div>
          <div className="goal-amount-cell">
            <span className="gac-label">剩余</span>
            <span className={`gac-value${paid ? ' done' : ' gap'}`}>
              {paid ? '已还清' : `¥${remaining.toLocaleString()}`}
            </span>
          </div>
        </div>

        {!paid && (
          <div className="goal-estimate loan-estimate">
            💰 每月还款&nbsp;<strong>¥{loan.monthlyPayment.toLocaleString()}</strong>
            &nbsp;· 还需&nbsp;<strong>{remainingMonths} 个月</strong>
          </div>
        )}

        {payingLoanId === loan.id && (
          <div className="goal-deposit-form">
            <div className="goal-deposit-row loan-pay-row">
              <span className="gdp loan-gdp">¥</span>
              <input
                type="number"
                min="0.01"
                placeholder="本次还款金额"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handlePayLoan(loan.id)}
              />
            </div>
            <div className="goal-deposit-btns">
              <button className="gdb-cancel" onClick={() => { setPayingLoanId(null); setPayAmount('') }}>取消</button>
              <button className="gdb-confirm loan-pay-confirm" onClick={() => handlePayLoan(loan.id)}>确认还款</button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="savings-page">
      {celebGoal && (
        <GoalCelebration goal={celebGoal} onClose={() => setCelebGoal(null)} />
      )}

      {/* ── 删除确认弹窗 ── */}
      {deleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-emoji">{deleteConfirm.emoji}</div>
            <div className="delete-confirm-title">确认删除</div>
            <div className="delete-confirm-msg">
              真的要删除 <strong>「{deleteConfirm.name}」</strong> 吗？<br/>
              <span className="delete-confirm-sub">删除后数据无法恢复</span>
            </div>
            <div className="delete-confirm-actions">
              <button className="delete-cancel-btn" onClick={() => setDeleteConfirm(null)}>再想想</button>
              <button
                className="delete-ok-btn"
                onClick={() => {
                  if (deleteConfirm.type === 'goal') onDelete(deleteConfirm.id)
                  else onDeleteLoan(deleteConfirm.id)
                  setDeleteConfirm(null)
                }}
              >确认删除</button>
            </div>
          </div>
        </div>
      )}
      {showTargetDatePicker && (
        <MonthWheelPicker
          value={newGoal.targetDate || currentYM}
          onChange={ym => setNewGoal(p => ({ ...p, targetDate: ym }))}
          onClose={() => setShowTargetDatePicker(false)}
        />
      )}
      {showLoanDatePicker && (
        <MonthWheelPicker
          value={(showLoanDatePicker === 'start' ? newLoan.startDate : newLoan.endDate) || currentYM}
          onChange={ym => setNewLoan(p => ({ ...p, [showLoanDatePicker === 'start' ? 'startDate' : 'endDate']: ym }))}
          onClose={() => setShowLoanDatePicker(null)}
        />
      )}

      {/* ── 子标签切换 ── */}
      <div className="savings-subtabs">
        <button className="savings-nav-arrow" onClick={() => switchTab(-1)} title="上一个（← 方向键）">‹</button>
        <button
          className={`savings-subtab${activeTab === 'savings' ? ' active' : ''}`}
          onClick={() => setActiveTab('savings')}
        >🎀 储蓄目标</button>
        <button
          className={`savings-subtab${activeTab === 'loans' ? ' active active-loan' : ''}`}
          onClick={() => setActiveTab('loans')}
        >💳 贷款管理</button>
        <button className="savings-nav-arrow" onClick={() => switchTab(1)} title="下一个（→ 方向键）">›</button>
      </div>

      {/* ══════════ 滑动切换容器 ══════════ */}
      <div className="savings-slider">
        <div className="savings-slide-track" style={{ transform: activeTab === 'loans' ? 'translateX(-100%)' : 'translateX(0)' }}>
          {/* ══ 储蓄目标 ══ */}
          <div className="savings-slide">
          <div className="savings-topbar">
            <h2 className="savings-title">🎀 储蓄目标{activeGoals.length > 0 ? `（${activeGoals.length} 个进行中）` : completedCount > 0 ? '（全部达成 🎉）' : ''}</h2>
            <div className="savings-topbar-actions">
              {!showAddForm && (
                <button className="savings-add-btn" onClick={() => setShowAddForm(true)}>
                  + 新增目标
                </button>
              )}
              {savingsGoals.length > 0 && (
                <button
                  className="savings-reset-btn"
                  title="重置所有卡片位置"
                  onClick={() => {
                    localStorage.removeItem('savings-card-layouts')
                    setLayouts({})
                  }}
                >↺</button>
              )}
            </div>
          </div>

          {savingsGoals.length > 0 && (
            <div className="savings-summary">
              <div className="savings-summary-item">
                <span className="ss-label">总已存</span>
                <span className="ss-value"><AnimatedNum value={totalSaved} /></span>
              </div>
              <div className="ss-divider"/>
              <div className="savings-summary-item">
                <span className="ss-label">总目标</span>
                <span className="ss-value"><AnimatedNum value={totalTarget} /></span>
              </div>
              <div className="ss-divider"/>
              <div className="savings-summary-item">
                <span className="ss-label">整体进度</span>
                <span className="ss-value ss-pct"><AnimatedNum value={overallPct} suffix="%" decimals={1} /></span>
              </div>
              {completedCount > 0 && (
                <>
                  <div className="ss-divider"/>
                  <div className="savings-summary-item">
                    <span className="ss-label">已达成</span>
                    <span className="ss-value ss-done">🎉 {completedCount} 个</span>
                  </div>
                </>
              )}
              {monthlyIncome > 0 && (
                <>
                  <div className="ss-divider"/>
                  <div className="savings-summary-item">
                    <span className="ss-label">月存建议</span>
                    <span className="ss-value ss-suggest"><AnimatedNum value={monthlySuggest} decimals={0} /></span>
                  </div>
                </>
              )}
            </div>
          )}

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

          {savingsGoals.length === 0 && !showAddForm && (
            <div className="savings-empty">
              <span className="savings-empty-icon">🎀</span>
              <p>还没有储蓄目标</p>
              <p className="savings-empty-sub">喵～ 来设定第一个目标吧！</p>
              <button className="savings-add-btn" style={{ marginTop: 16 }} onClick={() => setShowAddForm(true)}>
                + 添加第一个目标
              </button>
            </div>
          )}

          {(() => {
            const canvasH = savingsGoals.reduce((max, g, i) => {
              const l = getLayout(g.id, i)
              return Math.max(max, l.y + l.h)
            }, DEFAULT_H + 20)

            const dragLayout = activeCard ? getLayout(activeCard, savingsGoals.findIndex(g => g.id === activeCard)) : null
            const snapGap = GRID_GAP
            const canvasW = canvasRef.current?.offsetWidth || (COLS * (DEFAULT_W + GRID_GAP))
            const rawSnapX = dragLayout ? Math.round(dragLayout.x / (dragLayout.w + snapGap)) * (dragLayout.w + snapGap) : 0
            const rowSnapX = dragLayout && activeCard ? computeRowSnapX(dragLayout.x, activeCard, dragLayout, layouts, canvasW, SNAP_THRESHOLD * 3) : null
            const rawSnapY = dragLayout ? Math.round(dragLayout.y / (dragLayout.h + snapGap)) * (dragLayout.h + snapGap) : 0
            const snapX = dragLayout ? Math.min(rowSnapX !== null ? rowSnapX : rawSnapX, Math.max(0, canvasW - dragLayout.w)) : 0
            const snapY = Math.max(0, rawSnapY)

            return (
              <div className="savings-canvas" ref={canvasRef} style={{ minHeight: canvasH + 20 }}>
                {/* 网格 + 中心线：用 overflow:hidden 的包裹层限制在画布内 */}
                {(dragLayout || activeCard) && (
                  <div className="savings-canvas-overlay">
                    {dragLayout && (
                      <>
                        <div
                          className="savings-drag-grid"
                          style={{ backgroundSize: `${dragLayout.w}px ${dragLayout.h}px` }}
                        />
                        <div
                          className="savings-snap-ghost"
                          style={{ left: snapX, top: snapY, width: dragLayout.w, height: dragLayout.h }}
                        />
                      </>
                    )}
                  </div>
                )}
                {savingsGoals.map((goal, index) => {
                  const layout = getLayout(goal.id, index)
                  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0
                  const gap = Math.max(0, goal.targetAmount - goal.savedAmount)
                  const completed = goal.savedAmount >= goal.targetAmount

                  const hasDeadline = !completed && goal.targetDate
                  const monthsLeft = hasDeadline ? monthsUntil(goal.targetDate) : null
                  const deadlineRecommend = hasDeadline && monthsLeft > 0 ? Math.ceil(gap / monthsLeft) : null
                  const isOverdue = hasDeadline && monthsLeft !== null && monthsLeft <= 0
                  const monthsNeeded = monthlySuggest > 0 && gap > 0 ? Math.ceil(gap / monthlySuggest) : null

                  return (
                    <div
                      key={goal.id}
                      className={`goal-card goal-card-3d${completed ? ' completed' : ''}${flippedId === goal.id ? ' flipped' : ''}`}
                      style={{
                        left: layout.x, top: layout.y,
                        width: layout.w, height: layout.h,
                        zIndex: activeCard === goal.id ? 10 : 1,
                      }}
                    >
                      <div className="goal-card-inner">
                        {/* ── 正面 ── */}
                        <div className="goal-card-front">
                          {/* 拖拽手柄 */}
                          <div className="goal-drag-handle" onMouseDown={e => onCardDragStart(e, goal.id, index)}>
                            <div className="goal-handle-main">
                              <div className="goal-emoji">{goal.emoji}</div>
                              <div className="goal-name">{goal.name}</div>
                            </div>
                            <div className="goal-pct-top">{pct.toFixed(1)}%</div>
                          </div>

                          {/* 内容区 */}
                          <div className="goal-card-body" onClick={e => handleFrontClick(e, goal.id)}>
                            {completed && <div className="goal-done">🎉 目标达成！</div>}
                            <div className="goal-bar-track">
                              <div
                                className="goal-bar-fill"
                                style={{ width: `${pct}%`, background: completed ? 'linear-gradient(90deg,#22c55e,#86efac)' : 'linear-gradient(90deg,#c084fc,#f472b6)' }}
                              />
                            </div>
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
                            {!hasDeadline && monthsNeeded && !completed && (
                              <div className="goal-estimate">
                                💡 月存 ¥{monthlySuggest.toLocaleString()}（收入20%），约&nbsp;<strong>{monthsNeeded} 个月</strong>后达成
                              </div>
                            )}
                            {!hasDeadline && !monthlyIncome && !completed && (
                              <div className="goal-estimate hint">设置月收入后可查看预计存款时间</div>
                            )}
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
                            ) : null}
                          </div>

                          {/* resize 手柄 */}
                          <div className="goal-resize-handle goal-resize-left" onMouseDown={e => onCardResizeLeftStart(e, goal.id, index)} />
                          <div className="goal-resize-handle goal-resize-right" onMouseDown={e => onCardResizeStart(e, goal.id, index)} />
                        </div>

                        {/* ── 背面 ── */}
                        <div className="goal-card-back" onClick={() => setFlippedId(null)}>
                          <div className="gcb-center">
                            <div className="gcb-emoji">{goal.emoji}</div>
                            <div className="gcb-name">{goal.name}</div>
                          </div>
                          <div className="gcb-bottom">
                            {!completed && (
                              <button
                                className="gcb-deposit"
                                onClick={e => { e.stopPropagation(); setFlippedId(null); setDepositingId(goal.id); }}
                              >
                                🎀 存入
                              </button>
                            )}
                            <button
                              className="gcb-delete"
                              onClick={e => { e.stopPropagation(); setFlippedId(null); setDeleteConfirm({ type: 'goal', id: goal.id, name: goal.name, emoji: goal.emoji }); }}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
          </div>
          {/* ══ 贷款管理 ══ */}
          <div className="savings-slide">
          <div className="savings-topbar">
            <h2 className="savings-title">💳 贷款管理{activeLoans.length > 0 ? `（${activeLoans.length} 个进行中）` : paidLoans.length > 0 ? '（全部还清 🎉）' : ''}</h2>
            <div className="savings-topbar-actions">
              {!showAddLoanForm && (
                <button className="savings-add-btn loan-add-btn" onClick={() => setShowAddLoanForm(true)}>
                  + 新增贷款
                </button>
              )}
              {loans.length > 0 && (
                <button
                  className="savings-reset-btn"
                  title="重置所有卡片位置"
                  onClick={() => {
                    localStorage.removeItem('loan-card-layouts')
                    setLoanLayouts({})
                  }}
                >↺</button>
              )}
            </div>
          </div>

          {showAddLoanForm && (
            <div className="savings-form-card">
              <div className="savings-form-heading">新增贷款</div>
              <div className="emoji-grid">
                {LOAN_EMOJI_OPTIONS.map(em => (
                  <button
                    key={em}
                    type="button"
                    className={`emoji-btn${newLoan.emoji === em ? ' selected' : ''}`}
                    onClick={() => setNewLoan(p => ({ ...p, emoji: em }))}
                  >{em}</button>
                ))}
              </div>
              <div className="savings-form-row">
                <input
                  className="savings-input"
                  placeholder="贷款名称，例：房贷、车贷"
                  value={newLoan.name}
                  onChange={e => setNewLoan(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="savings-form-row">
                <div className="savings-amount-wrap" style={{ flex: 1 }}>
                  <span className="savings-amount-prefix">¥</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="贷款总额"
                    value={newLoan.totalAmount}
                    onChange={e => setNewLoan(p => ({ ...p, totalAmount: e.target.value }))}
                  />
                </div>
                <div className="savings-amount-wrap" style={{ flex: 1 }}>
                  <span className="savings-amount-prefix">¥</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="每月还款额"
                    value={newLoan.monthlyPayment}
                    onChange={e => setNewLoan(p => ({ ...p, monthlyPayment: e.target.value }))}
                  />
                </div>
              </div>
              <div className="savings-form-row loan-date-row">
                <button type="button" className="savings-date-trigger" style={{ flex: 1, width: 'auto' }} onClick={() => setShowLoanDatePicker('start')}>
                  <span>{newLoan.startDate ? `📅 ${formatMonthLabel(newLoan.startDate)} 开始` : '贷款开始时间（可选）'}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </button>
                <button type="button" className="savings-date-trigger" style={{ flex: 1, width: 'auto' }} onClick={() => setShowLoanDatePicker('end')}>
                  <span>{newLoan.endDate ? `📅 ${formatMonthLabel(newLoan.endDate)} 还清` : '贷款结束时间（可选）'}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </button>
              </div>
              {(newLoan.startDate || newLoan.endDate) && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  {newLoan.startDate && <button type="button" className="savings-date-clear" onClick={() => setNewLoan(p => ({ ...p, startDate: '' }))}>× 移除开始</button>}
                  {newLoan.endDate   && <button type="button" className="savings-date-clear" onClick={() => setNewLoan(p => ({ ...p, endDate: '' }))}>× 移除结束</button>}
                </div>
              )}
              {addLoanError && <p className="savings-error">{addLoanError}</p>}
              <div className="savings-form-actions">
                <button className="savings-cancel-btn" onClick={() => { setShowAddLoanForm(false); setAddLoanError('') }}>取消</button>
                <button className="savings-confirm-btn loan-confirm-btn" onClick={handleAddLoan}>确认添加</button>
              </div>
            </div>
          )}

          {loans.length === 0 && !showAddLoanForm && (
            <div className="savings-empty">
              <span className="savings-empty-icon">💳</span>
              <p>还没有贷款记录</p>
              <p className="savings-empty-sub">喵～ 来添加第一笔贷款吧！</p>
              <button className="savings-add-btn loan-add-btn" style={{ marginTop: 16 }} onClick={() => setShowAddLoanForm(true)}>
                + 添加贷款
              </button>
            </div>
          )}

          {loans.length > 0 && (
            <>
              <div className="loan-summary">
                <div className="savings-summary-item">
                  <span className="ss-label">总贷款</span>
                  <span className="ss-value">¥{totalDebt.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="ss-divider"/>
                <div className="savings-summary-item">
                  <span className="ss-label">已还</span>
                  <span className="ss-value">¥{totalPaid.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="ss-divider"/>
                <div className="savings-summary-item">
                  <span className="ss-label">剩余债务</span>
                  <span className="ss-value ss-debt">¥{totalRemaining.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="ss-divider"/>
                <div className="savings-summary-item">
                  <span className="ss-label">月还压力</span>
                  <span className="ss-value ss-monthly">¥{totalMonthlyPayment.toLocaleString()}/月</span>
                </div>
              </div>

              {(() => {
                const canvasH = loans.reduce((max, l, i) => {
                  const layout = getLoanLayout(l.id, i)
                  return Math.max(max, layout.y + layout.h)
                }, DEFAULT_H + 20)

                const dragLayout = activeCard && loans.some(l => l.id === activeCard)
                  ? getLoanLayout(activeCard, loans.findIndex(l => l.id === activeCard))
                  : null
                const canvasW = loanCanvasRef.current?.offsetWidth || (COLS * (DEFAULT_W + GRID_GAP))
                const rawSnapX = dragLayout ? Math.round(dragLayout.x / (dragLayout.w + GRID_GAP)) * (dragLayout.w + GRID_GAP) : 0
                const rowSnapX = dragLayout && activeCard ? computeRowSnapX(dragLayout.x, activeCard, dragLayout, loanLayouts, canvasW, SNAP_THRESHOLD * 3) : null
                const rawSnapY = dragLayout ? Math.round(dragLayout.y / (dragLayout.h + GRID_GAP)) * (dragLayout.h + GRID_GAP) : 0
                const snapX = dragLayout ? Math.min(rowSnapX !== null ? rowSnapX : rawSnapX, Math.max(0, canvasW - dragLayout.w)) : 0
                const snapY = Math.max(0, rawSnapY)

                return (
                  <div className="savings-canvas" ref={loanCanvasRef} style={{ minHeight: canvasH + 20 }}>
                    {/* 网格 + 吸附幽灵 */}
                    {(dragLayout || activeCard) && (
                      <div className="savings-canvas-overlay">
                        {dragLayout && (
                          <>
                            <div
                              className="savings-drag-grid"
                              style={{ backgroundSize: `${dragLayout.w}px ${dragLayout.h}px` }}
                            />
                            <div
                              className="savings-snap-ghost"
                              style={{ left: snapX, top: snapY, width: dragLayout.w, height: dragLayout.h }}
                            />
                          </>
                        )}
                      </div>
                    )}
                    {loans.map((loan, index) => {
                      const layout = getLoanLayout(loan.id, index)
                      const paid = loan.paidAmount >= loan.totalAmount

                      return (
                        <div
                          key={loan.id}
                          className={`goal-card loan-card goal-card-3d${paid ? ' completed loan-completed' : ''}${flippedId === loan.id ? ' flipped' : ''}`}
                          style={{
                            left: layout.x, top: layout.y,
                            width: layout.w, height: layout.h,
                            zIndex: activeCard === loan.id ? 10 : 1,
                          }}
                        >
                          <div className="goal-card-inner">
                            {/* ── 正面 ── */}
                            <div className="goal-card-front">
                              <div className="goal-drag-handle" onMouseDown={e => onLoanCardDragStart(e, loan.id, index)}>
                                <div className="goal-handle-main">
                                  <div className="goal-emoji">{loan.emoji}</div>
                                  <div className="goal-name">{loan.name}</div>
                                </div>
                              </div>
                              <div className="goal-card-body" onClick={e => handleFrontClick(e, loan.id)}>
                                {renderLoanCardBody(loan)}
                              </div>
                              <div className="goal-resize-handle goal-resize-right" onMouseDown={e => onLoanCardResizeStart(e, loan.id, index)} />
                            </div>
                            {/* ── 背面 ── */}
                            <div className="goal-card-back" onClick={() => setFlippedId(null)}>
                              <div className="gcb-center">
                                <div className="gcb-emoji">{loan.emoji}</div>
                                <div className="gcb-name">{loan.name}</div>
                              </div>
                              <div className="gcb-bottom">
                                {!paid && (
                                  <button
                                    className="gcb-deposit loan-pay-btn"
                                    onClick={e => { e.stopPropagation(); setFlippedId(null); setPayingLoanId(loan.id); setPayAmount(loan.monthlyPayment.toString()); }}
                                  >
                                    💳 还款
                                  </button>
                                )}
                                <button
                                  className="gcb-delete"
                                  onClick={e => { e.stopPropagation(); setFlippedId(null); setDeleteConfirm({ type: 'loan', id: loan.id, name: loan.name, emoji: loan.emoji }); }}
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
