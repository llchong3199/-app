import { useEffect, useState } from 'react'
import './PiggyDialog.css'

function PigSVG() {
  return (
    <svg viewBox="0 0 120 112" className="pig-svg" aria-hidden="true">
      {/* body */}
      <ellipse cx="60" cy="80" rx="43" ry="28" fill="#FFB7C5"/>
      {/* head */}
      <circle cx="60" cy="44" r="32" fill="#FFB7C5"/>
      {/* left ear */}
      <ellipse cx="33" cy="19" rx="12" ry="14" fill="#FFB7C5"/>
      <ellipse cx="33" cy="19" rx="7"  ry="9"  fill="#FF8FA3"/>
      {/* right ear */}
      <ellipse cx="87" cy="19" rx="12" ry="14" fill="#FFB7C5"/>
      <ellipse cx="87" cy="19" rx="7"  ry="9"  fill="#FF8FA3"/>
      {/* eyes */}
      <circle cx="47" cy="37" r="6.5" fill="white"/>
      <circle cx="73" cy="37" r="6.5" fill="white"/>
      <circle cx="48.5" cy="38" r="3.8" fill="#1a1a1a"/>
      <circle cx="74.5" cy="38" r="3.8" fill="#1a1a1a"/>
      <circle cx="49.5" cy="37" r="1.4" fill="white"/>
      <circle cx="75.5" cy="37" r="1.4" fill="white"/>
      {/* snout */}
      <ellipse cx="60" cy="54" rx="12" ry="8" fill="#FF8FA3"/>
      <circle cx="55" cy="54" r="2.6" fill="#C0607A"/>
      <circle cx="65" cy="54" r="2.6" fill="#C0607A"/>
      {/* smile */}
      <path d="M50,62 Q60,69 70,62" fill="none" stroke="#C0607A" strokeWidth="2.2" strokeLinecap="round"/>
      {/* coin slot (gold) */}
      <rect x="54" y="13" width="12" height="4.5" rx="2.2" fill="#D4AF37" stroke="#B8960C" strokeWidth="0.6"/>
      {/* legs */}
      <ellipse cx="36"  cy="101" rx="11" ry="7" fill="#FFB7C5"/>
      <ellipse cx="54"  cy="103" rx="11" ry="7" fill="#FFB7C5"/>
      <ellipse cx="72"  cy="103" rx="11" ry="7" fill="#FFB7C5"/>
      <ellipse cx="90"  cy="101" rx="11" ry="7" fill="#FFB7C5"/>
      {/* tail curl */}
      <path d="M103,75 C114,68 114,55 105,51" fill="none" stroke="#FFB7C5" strokeWidth="5.5" strokeLinecap="round"/>
    </svg>
  )
}

export function PiggyDialog({ income, onGoToSavings, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  function goSavings() {
    setVisible(false)
    setTimeout(() => { onClose(); onGoToSavings() }, 280)
  }

  const s20 = Math.round(income * 0.2)
  const s30 = Math.round(income * 0.3)

  return (
    <div className={`piggy-overlay${visible ? ' visible' : ''}`} onClick={dismiss}>
      <div className={`piggy-dialog${visible ? ' visible' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="piggy-body">
          <div className="pig-wrap">
            <PigSVG />
          </div>
          <div className="piggy-bubble">
            <p className="piggy-greeting">
              呼噜呼噜～ 工资&nbsp;<strong>¥{income.toLocaleString()}</strong>&nbsp;到手啦！
            </p>
            <p className="piggy-sub">快来喂我，把钱存进来吧 🪙</p>
            <div className="piggy-rates">
              <div className="piggy-rate-chip">
                <span>存 20%</span>
                <strong>¥{s20.toLocaleString()}</strong>
              </div>
              <div className="piggy-rate-chip">
                <span>存 30%</span>
                <strong>¥{s30.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="piggy-actions">
          <button className="piggy-btn-go" onClick={goSavings}>🐷 去设储蓄目标</button>
          <button className="piggy-btn-dismiss" onClick={dismiss}>先不了</button>
        </div>
      </div>
    </div>
  )
}
