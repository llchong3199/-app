import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './AvatarPicker.css'

const EMOJIS = [
  '😊','😎','🤩','😄','🥳','😏','🤓','🤠',
  '🦁','🐯','🐼','🦊','🐨','🐸','🦄','🐙',
  '🌟','⭐','🎯','🎮','🎸','🏆','🚀','💎',
  '🌈','🌸','🍀','🔥','⚡','🌙','☀️','🎉',
]

const CROP_SIZE = 300

function CropModal({ src, onConfirm, onCancel }) {
  const [circle, setCircle] = useState(null)
  const [drag, setDrag] = useState(null)
  const imgRef = useRef()
  const containerRef = useRef()

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    function init() {
      const scale = Math.min(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
      const dispW = img.naturalWidth * scale
      const dispH = img.naturalHeight * scale
      const r = Math.min(dispW, dispH) / 2 * 0.8
      setCircle({ x: CROP_SIZE / 2, y: CROP_SIZE / 2, r })
    }
    if (img.complete && img.naturalWidth > 0) init()
    else img.addEventListener('load', init, { once: true })
  }, [src])

  function containerPos(e) {
    const rect = containerRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onMouseDown(e) {
    if (!circle) return
    e.preventDefault()
    const { x, y } = containerPos(e)
    const dx = x - circle.x
    const dy = y - circle.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= circle.r - 14) {
      setDrag({ type: 'move', sx: x, sy: y, cx0: circle.x, cy0: circle.y })
    } else if (dist <= circle.r + 14) {
      setDrag({ type: 'resize', cx: circle.x, cy: circle.y })
    }
  }

  function onMouseMove(e) {
    if (!drag || !circle) return
    const { x, y } = containerPos(e)
    if (drag.type === 'move') {
      const newX = drag.cx0 + (x - drag.sx)
      const newY = drag.cy0 + (y - drag.sy)
      setCircle(c => ({
        ...c,
        x: Math.max(c.r, Math.min(CROP_SIZE - c.r, newX)),
        y: Math.max(c.r, Math.min(CROP_SIZE - c.r, newY)),
      }))
    } else {
      const dx = x - drag.cx
      const dy = y - drag.cy
      const r = Math.sqrt(dx * dx + dy * dy)
      setCircle(c => ({
        ...c,
        r: Math.max(20, Math.min(r, c.x, c.y, CROP_SIZE - c.x, CROP_SIZE - c.y)),
      }))
    }
  }

  function onMouseUp() { setDrag(null) }

  function handleConfirm() {
    const img = imgRef.current
    if (!img || !circle) return
    const scale = Math.min(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
    const ox = (CROP_SIZE - img.naturalWidth * scale) / 2
    const oy = (CROP_SIZE - img.naturalHeight * scale) / 2
    const srcCx = (circle.x - ox) / scale
    const srcCy = (circle.y - oy) / scale
    const srcR = circle.r / scale
    const size = 200
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, srcCx - srcR, srcCy - srcR, srcR * 2, srcR * 2, 0, 0, size, size)
    onConfirm(canvas.toDataURL('image/png'))
  }

  const c = circle

  return createPortal(
    <div className="crop-overlay" onClick={onCancel}>
      <div className="crop-panel" onClick={e => e.stopPropagation()}>
        <div className="ap-header">
          <span>选择头像区域</span>
          <button className="ap-close" onClick={onCancel}>×</button>
        </div>
        <div
          ref={containerRef}
          className="crop-container"
          style={{ width: CROP_SIZE, height: CROP_SIZE }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <img ref={imgRef} src={src} className="crop-img" draggable={false} alt="" />
          {c && (
            <svg className="crop-svg" width={CROP_SIZE} height={CROP_SIZE}>
              <defs>
                <mask id="crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <circle cx={c.x} cy={c.y} r={c.r} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)" />
              <circle cx={c.x} cy={c.y} r={c.r} fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 3" />
              <circle cx={c.x + c.r} cy={c.y} r={7} fill="white" stroke="#6366f1" strokeWidth="2" style={{ cursor: 'ew-resize' }} />
            </svg>
          )}
        </div>
        <p className="crop-hint">拖动圆圈移动选区 · 拖动边缘白点调整大小</p>
        <div className="crop-actions">
          <button className="crop-cancel-btn" onClick={onCancel}>取消</button>
          <button className="crop-confirm-btn" onClick={handleConfirm}>确认</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function AvatarPicker({ onSelect, onClose }) {
  const fileRef = useRef()
  const [cropSrc, setCropSrc] = useState(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (cropSrc) {
    return (
      <CropModal
        src={cropSrc}
        onConfirm={dataUrl => { onSelect(dataUrl); onClose() }}
        onCancel={() => setCropSrc(null)}
      />
    )
  }

  return createPortal(
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-panel" onClick={e => e.stopPropagation()}>
        <div className="ap-header">
          <span>选择头像</span>
          <button className="ap-close" onClick={onClose}>×</button>
        </div>
        <div className="ap-emoji-grid">
          {EMOJIS.map(em => (
            <button key={em} className="ap-emoji-btn" onClick={() => { onSelect(em); onClose() }}>
              {em}
            </button>
          ))}
        </div>
        <div className="ap-divider" />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button className="ap-upload-btn" onClick={() => fileRef.current.click()}>
          📁 从本地上传图片
        </button>
      </div>
    </div>,
    document.body
  )
}

export function UserAvatar({ avatar, size = 32, className = '' }) {
  if (avatar?.startsWith('data:')) {
    return (
      <img
        src={avatar}
        alt="avatar"
        className={`user-avatar-img ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return <span className={`user-avatar-emoji ${className}`} style={{ fontSize: size * 0.8 }}>{avatar}</span>
}
