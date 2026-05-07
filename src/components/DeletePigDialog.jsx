import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './DeletePigDialog.css'

function SadPigSVG() {
  return (
    <svg viewBox="0 0 120 112" className="del-pig-svg" aria-hidden="true">
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
      {/* sad eyebrows */}
      <path d="M41,28 Q47,24 52,27" fill="none" stroke="#C0607A" strokeWidth="2" strokeLinecap="round"/>
      <path d="M68,27 Q73,24 79,28" fill="none" stroke="#C0607A" strokeWidth="2" strokeLinecap="round"/>
      {/* eyes */}
      <circle cx="47" cy="37" r="6.5" fill="white"/>
      <circle cx="73" cy="37" r="6.5" fill="white"/>
      <circle cx="47" cy="38.5" r="3.8" fill="#1a1a1a"/>
      <circle cx="73" cy="38.5" r="3.8" fill="#1a1a1a"/>
      <circle cx="48" cy="37.5" r="1.4" fill="white"/>
      <circle cx="74" cy="37.5" r="1.4" fill="white"/>
      {/* tears */}
      <ellipse cx="43" cy="46" rx="2.2" ry="3.5" fill="#7EC8E3" opacity="0.85"/>
      <ellipse cx="69" cy="46" rx="2.2" ry="3.5" fill="#7EC8E3" opacity="0.85"/>
      {/* snout */}
      <ellipse cx="60" cy="54" rx="12" ry="8" fill="#FF8FA3"/>
      <circle cx="55" cy="54" r="2.6" fill="#C0607A"/>
      <circle cx="65" cy="54" r="2.6" fill="#C0607A"/>
      {/* sad mouth */}
      <path d="M50,65 Q60,58 70,65" fill="none" stroke="#C0607A" strokeWidth="2.2" strokeLinecap="round"/>
      {/* coin slot */}
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
        <div className="del-pig-wrap">
          <SadPigSVG />
        </div>
        <p className="del-pig-title">别删除我！</p>
        <p className="del-pig-sub">你的所有消费记录和储蓄目标<br/>都会永远消失哦… 🥺</p>
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
