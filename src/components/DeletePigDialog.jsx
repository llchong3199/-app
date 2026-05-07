import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './DeletePigDialog.css'

function SadHelloKittySVG() {
  return (
    <svg viewBox="0 0 120 120" className="del-kitty-svg" aria-hidden="true">
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
      {/* sad eyebrows (inner corners raised) */}
      <path d="M40,41 Q43,36 52,40" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
      <path d="M68,40 Q77,36 80,41" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
      {/* eyes */}
      <ellipse cx="47" cy="52" rx="4.2" ry="4.8" fill="#1a1a1a"/>
      <ellipse cx="73" cy="52" rx="4.2" ry="4.8" fill="#1a1a1a"/>
      {/* eye shine */}
      <circle cx="49" cy="50" r="1.5" fill="white"/>
      <circle cx="75" cy="50" r="1.5" fill="white"/>
      {/* tears */}
      <ellipse cx="44" cy="60" rx="2.5" ry="4" fill="#A8D8F0" opacity="0.85"/>
      <ellipse cx="70" cy="60" rx="2.5" ry="4" fill="#A8D8F0" opacity="0.85"/>
      {/* nose */}
      <ellipse cx="60" cy="61" rx="2.2" ry="1.6" fill="#FFDA6E"/>
      {/* whiskers left */}
      <line x1="54" y1="58" x2="34" y2="54" stroke="#D4B0C0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="54" y1="63" x2="34" y2="64" stroke="#D4B0C0" strokeWidth="1.2" strokeLinecap="round"/>
      {/* whiskers right */}
      <line x1="66" y1="58" x2="86" y2="54" stroke="#D4B0C0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="66" y1="63" x2="86" y2="64" stroke="#D4B0C0" strokeWidth="1.2" strokeLinecap="round"/>
      {/* chest bow left petal */}
      <path d="M55,88 C52,83 45,84 47,88 C49,92 55,88 Z" fill="#FF6B9D" opacity="0.5"/>
      {/* chest bow right petal */}
      <path d="M65,88 C68,83 75,84 73,88 C71,92 65,88 Z" fill="#FF6B9D" opacity="0.5"/>
      {/* chest bow center */}
      <circle cx="60" cy="88" r="3" fill="#FFB7D1" opacity="0.7"/>
      {/* left arm (drooping) */}
      <ellipse cx="33" cy="90" rx="9" ry="6" fill="white" stroke="#FFD0E8" strokeWidth="1.5" transform="rotate(15 33 90)"/>
      {/* right arm (drooping) */}
      <ellipse cx="87" cy="90" rx="9" ry="6" fill="white" stroke="#FFD0E8" strokeWidth="1.5" transform="rotate(-15 87 90)"/>
      {/* left leg */}
      <ellipse cx="47" cy="114" rx="11" ry="7" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
      {/* right leg */}
      <ellipse cx="73" cy="114" rx="11" ry="7" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
    </svg>
  )
}

export function DeletePigDialog({ onCancel, onConfirmDelete }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  function handleCancel() {
    setVisible(false)
    setTimeout(onCancel, 280)
  }

  function handleDelete() {
    setVisible(false)
    setTimeout(onConfirmDelete, 280)
  }

  return createPortal(
    <div className={`del-pig-overlay${visible ? ' visible' : ''}`}>
      <div className={`del-pig-card${visible ? ' visible' : ''}`}>
        <div className="del-kitty-wrap">
          <SadHelloKittySVG />
        </div>
        <p className="del-pig-title">别删除我！🎀</p>
        <p className="del-pig-sub">你的所有消费记录和储蓄目标<br/>都会永远消失哦… 💔</p>
        <button className="del-pig-stay" onClick={handleCancel}>
          我再想想
        </button>
        <button className="del-pig-confirm" onClick={handleDelete}>
          依旧选择删除
        </button>
      </div>
    </div>,
    document.body
  )
}
