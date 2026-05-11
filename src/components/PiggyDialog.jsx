import { useEffect, useState } from 'react'
import './PiggyDialog.css'

function HelloKittySVG() {
  return (
    <svg viewBox="0 0 120 120" className="kitty-svg" aria-hidden="true">
      {/* body */}
      <ellipse cx="60" cy="100" rx="28" ry="18" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
      {/* head */}
      <circle cx="60" cy="54" r="31" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
      {/* left ear outer */}
      <polygon points="28,28 23,8 44,22" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
      {/* left ear inner */}
      <polygon points="30,25 26,13 42,22" fill="#FFCCE0"/>
      {/* right ear outer */}
      <polygon points="92,28 97,8 76,22" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
      {/* right ear inner */}
      <polygon points="90,25 94,13 78,22" fill="#FFCCE0"/>
      {/* bow left petal */}
      <path d="M90,12 C86,5 77,6 79,12 C81,18 90,12 Z" fill="#FF6B9D"/>
      {/* bow right petal */}
      <path d="M98,12 C102,5 111,6 109,12 C107,18 98,12 Z" fill="#FF6B9D"/>
      {/* bow center */}
      <circle cx="94" cy="12" r="4.5" fill="#FFB7D1"/>
      {/* eyes */}
      <ellipse cx="47" cy="52" rx="4" ry="4.5" fill="#1a1a1a"/>
      <ellipse cx="73" cy="52" rx="4" ry="4.5" fill="#1a1a1a"/>
      {/* eye shine */}
      <circle cx="49" cy="50" r="1.5" fill="white"/>
      <circle cx="75" cy="50" r="1.5" fill="white"/>
      {/* nose */}
      <ellipse cx="60" cy="60" rx="2.2" ry="1.6" fill="#FFDA6E"/>
      {/* whiskers left */}
      <line x1="54" y1="57" x2="34" y2="53" stroke="#D4B0C0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="54" y1="62" x2="34" y2="63" stroke="#D4B0C0" strokeWidth="1.2" strokeLinecap="round"/>
      {/* whiskers right */}
      <line x1="66" y1="57" x2="86" y2="53" stroke="#D4B0C0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="66" y1="62" x2="86" y2="63" stroke="#D4B0C0" strokeWidth="1.2" strokeLinecap="round"/>
      {/* chest bow left petal */}
      <path d="M55,88 C52,83 45,84 47,88 C49,92 55,88 Z" fill="#FF6B9D" opacity="0.75"/>
      {/* chest bow right petal */}
      <path d="M65,88 C68,83 75,84 73,88 C71,92 65,88 Z" fill="#FF6B9D" opacity="0.75"/>
      {/* chest bow center */}
      <circle cx="60" cy="88" r="3" fill="#FFB7D1"/>
      {/* left arm */}
      <ellipse cx="33" cy="88" rx="9" ry="6" fill="white" stroke="#FFD0E8" strokeWidth="1.5" transform="rotate(-20 33 88)"/>
      {/* right arm */}
      <ellipse cx="87" cy="88" rx="9" ry="6" fill="white" stroke="#FFD0E8" strokeWidth="1.5" transform="rotate(20 87 88)"/>
      {/* left leg */}
      <ellipse cx="47" cy="114" rx="11" ry="7" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
      {/* right leg */}
      <ellipse cx="73" cy="114" rx="11" ry="7" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
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
          <div className="kitty-wrap">
            <HelloKittySVG />
          </div>
          <div className="piggy-bubble">
            <p className="piggy-greeting">
              喵～ 工资&nbsp;<strong>¥{income.toLocaleString()}</strong>&nbsp;到手啦！
            </p>
            <p className="piggy-sub">快来存钱，一起攒梦想吧 🎀</p>
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
          <button className="piggy-btn-go" onClick={goSavings}>🎀 去设储蓄目标</button>
          <button className="piggy-btn-dismiss" onClick={dismiss}>先不了</button>
        </div>
      </div>
    </div>
  )
}
