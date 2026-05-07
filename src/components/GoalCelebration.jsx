import { useEffect, useState, useMemo } from 'react'
import './GoalCelebration.css'

const CONFETTI_COLORS = [
  '#FF6B9D','#FFB7D1','#FF8BBF','#FF80AB',
  '#F06292','#56CCF2','#6FCF97','#F2C94C','#9B51E0','#FF8C42',
]

function HelloKittySVG() {
  return (
    <svg viewBox="0 0 120 120" className="celeb-kitty-svg" aria-hidden="true">
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
      {/* left arm (raised for dancing) */}
      <ellipse cx="31" cy="82" rx="9" ry="6" fill="white" stroke="#FFD0E8" strokeWidth="1.5" transform="rotate(-50 31 82)"/>
      {/* right arm (raised for dancing) */}
      <ellipse cx="89" cy="82" rx="9" ry="6" fill="white" stroke="#FFD0E8" strokeWidth="1.5" transform="rotate(50 89 82)"/>
      {/* left leg */}
      <ellipse cx="47" cy="114" rx="11" ry="7" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
      {/* right leg */}
      <ellipse cx="73" cy="114" rx="11" ry="7" fill="white" stroke="#FFD0E8" strokeWidth="1.5"/>
    </svg>
  )
}

export function GoalCelebration({ goal, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 320)
  }

  // Pre-generate confetti so it's stable across renders
  const confetti = useMemo(() =>
    Array.from({ length: 36 }, (_, i) => ({
      left:     `${(i / 36) * 100 + (Math.random() - 0.5) * 8}%`,
      delay:    `${Math.random() * 0.7}s`,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      drift:    `${(Math.random() - 0.5) * 280}px`,
      size:     `${7 + Math.random() * 8}px`,
      duration: `${1.8 + Math.random() * 1.2}s`,
      rotate:   `${Math.random() * 360}deg`,
      shape:    i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'diamond',
    })), []
  )

  return (
    <div className={`celeb-overlay${visible ? ' visible' : ''}`} onClick={handleClose}>
      {/* ── Confetti ── */}
      {confetti.map((c, i) => (
        <div
          key={i}
          className={`celeb-confetti ${c.shape}`}
          style={{
            left: c.left,
            animationDelay: c.delay,
            animationDuration: c.duration,
            '--drift': c.drift,
            '--rotate': c.rotate,
            width: c.size,
            height: c.size,
            background: c.color,
          }}
        />
      ))}

      {/* ── Center card ── */}
      <div className={`celeb-card${visible ? ' visible' : ''}`} onClick={e => e.stopPropagation()}>

        {/* floating stars orbit */}
        <div className="celeb-orbit">
          {['🎀','🌸','💕','✨','🎀','💫'].map((s, i) => (
            <span key={i} className="celeb-star" style={{ '--i': i, '--total': 6 }}>{s}</span>
          ))}
        </div>

        {/* dancing kitty */}
        <div className="celeb-kitty-wrap">
          <HelloKittySVG />
        </div>

        <div className="celeb-fireworks">🎀 ✨ 💕</div>
        <h2 className="celeb-title">恭喜达成目标！</h2>

        <div className="celeb-goal-badge">
          <span className="celeb-goal-emoji">{goal.emoji}</span>
          <span className="celeb-goal-name">{goal.name}</span>
        </div>

        <div className="celeb-amount">¥{goal.targetAmount.toLocaleString()}</div>

        <p className="celeb-quote">喵喵～ 你真的太棒啦！🎀</p>

        <button className="celeb-close-btn" onClick={handleClose}>
          喵喵太棒了！🎀
        </button>
      </div>
    </div>
  )
}
