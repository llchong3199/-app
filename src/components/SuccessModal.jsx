import { useEffect, useState, useRef } from 'react'
import { getCategoryColor, getCategoryIcon } from '../constants/categories'
import { FRUGALITY_QUOTES } from '../constants/quotes'
import './SuccessModal.css'

function Sparkle({ delay, left, top, size }) {
  return (
    <span
      className="ms-sparkle"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        animationDelay: `${delay}s`,
      }}
    />
  )
}

export function SuccessModal({ expense, quoteIndex, onClose }) {
  const [visible, setVisible] = useState(false)
  const [closed, setClosed] = useState(false)
  const quote = FRUGALITY_QUOTES[quoteIndex % FRUGALITY_QUOTES.length]
  const color = getCategoryColor(expense.category)
  const icon = getCategoryIcon(expense.category)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setClosed(true)
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  const sparkles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      delay: 0.1 + i * 0.08,
      left: 10 + Math.random() * 80,
      top: 5 + Math.random() * 90,
      size: 3 + Math.random() * 5,
    }))
  )

  return (
    <div className={`ms-overlay${visible ? ' visible' : ''}${closed ? ' closing' : ''}`} onClick={handleClose}>
      <div className={`ms-card${visible ? ' visible' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 装饰闪粉 */}
        <div className="ms-particle-layer" aria-hidden>
          {sparkles.current.map((s, i) => (
            <Sparkle key={i} {...s} />
          ))}
        </div>

        {/* Kitty 印章装饰 */}
        <div className="ms-kitty-stamp">
          <img src="/kitty-success.jpg" alt="" />
        </div>

        {/* 分类图标 */}
        <div className="ms-icon-ring" style={{ background: `${color}18`, borderColor: `${color}30` }}>
          <span className="ms-icon">{icon}</span>
        </div>

        <div className="ms-check" style={{ color }}>✓ 记一笔</div>

        <div className="ms-amount">¥{expense.amount.toFixed(2)}</div>

        <div className="ms-category" style={{ color }}>{expense.category}</div>

        <div className="ms-meta">
          <span>{expense.date}</span>
          <span className="ms-dot">·</span>
          <span>{time}</span>
          {expense.note && (
            <>
              <span className="ms-dot">·</span>
              <span>{expense.note}</span>
            </>
          )}
        </div>

        <div className="ms-divider" />

        <div className="ms-quote">
          <span className="ms-quote-icon">💬</span>
          <span>"{quote}"</span>
        </div>

        <button className="ms-btn" onClick={handleClose}>
          知道了 ✨
        </button>
      </div>
    </div>
  )
}
