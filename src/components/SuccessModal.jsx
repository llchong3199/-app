import { useEffect, useState } from 'react'
import { getCategoryColor, getCategoryIcon } from '../constants/categories'
import { FRUGALITY_QUOTES } from '../constants/quotes'
import './SuccessModal.css'

export function SuccessModal({ expense, quoteIndex, onClose }) {
  const [visible, setVisible] = useState(false)
  const quote = FRUGALITY_QUOTES[quoteIndex % FRUGALITY_QUOTES.length]
  const color = getCategoryColor(expense.category)
  const icon = getCategoryIcon(expense.category)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`modal-overlay${visible ? ' visible' : ''}`} onClick={handleClose}>
      <div className={`success-modal${visible ? ' visible' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-icon-ring" style={{ background: color + '18', border: `2px solid ${color}33` }}>
          <span className="modal-icon">{icon}</span>
        </div>

        <div className="modal-kitty-tag">🎀</div>

        <div className="modal-check" style={{ color }}>✓ 记录成功</div>

        <div className="modal-category" style={{ color }}>{expense.category}</div>

        <div className="modal-amount">¥{expense.amount.toFixed(2)}</div>

        <div className="modal-meta">
          <span>{expense.date}</span>
          <span className="modal-dot">·</span>
          <span>{time}</span>
          {expense.note && (
            <>
              <span className="modal-dot">·</span>
              <span>{expense.note}</span>
            </>
          )}
        </div>

        <div className="modal-divider" />

        <div className="modal-quote">
          <span className="modal-quote-icon">🎀</span>
          <span>"{quote}"</span>
        </div>

        <button className="modal-close-btn" onClick={handleClose}>知道了</button>
      </div>
    </div>
  )
}
