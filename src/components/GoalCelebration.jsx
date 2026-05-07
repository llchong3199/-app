import { useEffect, useState, useMemo } from 'react'
import './GoalCelebration.css'

const CONFETTI_COLORS = [
  '#D4AF37','#F0C968','#ef4444','#22c55e',
  '#3b82f6','#ec4899','#f97316','#a855f7','#FFB7C5',
]

function PigSVG() {
  return (
    <svg viewBox="0 0 120 112" className="celeb-pig-svg" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="43" ry="28" fill="#FFB7C5"/>
      <circle  cx="60" cy="44" r="32"  fill="#FFB7C5"/>
      <ellipse cx="33" cy="19" rx="12" ry="14" fill="#FFB7C5"/>
      <ellipse cx="33" cy="19" rx="7"  ry="9"  fill="#FF8FA3"/>
      <ellipse cx="87" cy="19" rx="12" ry="14" fill="#FFB7C5"/>
      <ellipse cx="87" cy="19" rx="7"  ry="9"  fill="#FF8FA3"/>
      <circle  cx="47" cy="37" r="6.5" fill="white"/>
      <circle  cx="73" cy="37" r="6.5" fill="white"/>
      <circle  cx="48.5" cy="38" r="3.8" fill="#1a1a1a"/>
      <circle  cx="74.5" cy="38" r="3.8" fill="#1a1a1a"/>
      <circle  cx="49.5" cy="37" r="1.4" fill="white"/>
      <circle  cx="75.5" cy="37" r="1.4" fill="white"/>
      <ellipse cx="60" cy="54" rx="12" ry="8"  fill="#FF8FA3"/>
      <circle  cx="55" cy="54" r="2.6" fill="#C0607A"/>
      <circle  cx="65" cy="54" r="2.6" fill="#C0607A"/>
      {/* big happy smile */}
      <path d="M46,60 Q60,72 74,60" fill="none" stroke="#C0607A" strokeWidth="2.8" strokeLinecap="round"/>
      {/* rosy cheeks */}
      <ellipse cx="38" cy="50" rx="7" ry="4" fill="#FF8FA3" opacity="0.5"/>
      <ellipse cx="82" cy="50" rx="7" ry="4" fill="#FF8FA3" opacity="0.5"/>
      <rect x="54" y="13" width="12" height="4.5" rx="2.2" fill="#D4AF37" stroke="#B8960C" strokeWidth="0.6"/>
      <ellipse cx="36"  cy="101" rx="11" ry="7" fill="#FFB7C5"/>
      <ellipse cx="54"  cy="103" rx="11" ry="7" fill="#FFB7C5"/>
      <ellipse cx="72"  cy="103" rx="11" ry="7" fill="#FFB7C5"/>
      <ellipse cx="90"  cy="101" rx="11" ry="7" fill="#FFB7C5"/>
      <path d="M103,75 C114,68 114,55 105,51" fill="none" stroke="#FFB7C5" strokeWidth="5.5" strokeLinecap="round"/>
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
          {['✨','🌟','💫','⭐','✨','🌟'].map((s, i) => (
            <span key={i} className="celeb-star" style={{ '--i': i, '--total': 6 }}>{s}</span>
          ))}
        </div>

        {/* dancing pig */}
        <div className="celeb-pig-wrap">
          <PigSVG />
        </div>

        <div className="celeb-fireworks">🎊 🎉 🎊</div>
        <h2 className="celeb-title">恭喜达成目标！</h2>

        <div className="celeb-goal-badge">
          <span className="celeb-goal-emoji">{goal.emoji}</span>
          <span className="celeb-goal-name">{goal.name}</span>
        </div>

        <div className="celeb-amount">¥{goal.targetAmount.toLocaleString()}</div>

        <p className="celeb-quote">呼噜呼噜～ 你真的太棒啦！🐷</p>

        <button className="celeb-close-btn" onClick={handleClose}>
          太棒了！✨
        </button>
      </div>
    </div>
  )
}
