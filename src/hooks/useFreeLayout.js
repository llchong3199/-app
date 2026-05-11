import { useState, useEffect, useRef } from 'react'

const DEFAULT_W = 300
const DEFAULT_H = 310
const GRID_GAP = 16
const COLS = 3

export function findFreePosition(w, h, existingLayouts) {
  const cellW = w + GRID_GAP
  const cellH = h + GRID_GAP
  const existing = Object.values(existingLayouts)
  for (let row = 0; row < 30; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * cellW
      const y = row * cellH
      const overlaps = existing.some(l =>
        x < l.x + l.w + GRID_GAP && x + w + GRID_GAP > l.x &&
        y < l.y + l.h + GRID_GAP && y + h + GRID_GAP > l.y
      )
      if (!overlaps) return { x, y, w, h }
    }
  }
  const maxY = existing.reduce((m, l) => Math.max(m, l.y + l.h), 0)
  return { x: 0, y: maxY + GRID_GAP, w, h }
}

function defaultLayout(index) {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return { x: col * (DEFAULT_W + GRID_GAP), y: row * (DEFAULT_H + GRID_GAP), w: DEFAULT_W, h: DEFAULT_H }
}

function cleanLayouts(raw) {
  if (!raw) return {}
  const clean = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v.x === 'number' && typeof v.y === 'number' && typeof v.w === 'number' && typeof v.h === 'number' && !isNaN(v.x) && !isNaN(v.y) && !isNaN(v.w) && !isNaN(v.h) && v.x >= 0 && v.y >= 0 && v.w >= 0 && v.h >= 0) {
      clean[k] = v
    }
  }
  return clean
}

export function useFreeLayout(storageKey, items) {
  const [layouts, setLayouts] = useState(() => {
    try { return cleanLayouts(JSON.parse(localStorage.getItem(storageKey) || '{}')) }
    catch { return {} }
  })
  const [activeCard, setActiveCard] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(layouts))
  }, [layouts, storageKey])

  useEffect(() => {
    setLayouts(prev => {
      const validIds = new Set(items.map(i => i.id))
      let updated = Object.fromEntries(Object.entries(prev).filter(([k]) => validIds.has(k)))
      items.forEach(item => {
        if (!updated[item.id]) {
          const existing = {}
          items.forEach(i => { if (updated[i.id]) existing[i.id] = updated[i.id] })
          updated = { ...updated, [item.id]: findFreePosition(DEFAULT_W, DEFAULT_H, existing) }
        }
      })
      const sameSize = Object.keys(updated).length === Object.keys(prev).length
      const sameContent = sameSize && Object.keys(updated).every(k => prev[k] === updated[k])
      return sameContent ? prev : updated
    })
  }, [items])

  function getLayout(id, index) {
    if (layouts[id]) return layouts[id]
    const others = {}
    items.forEach(i => { if (i.id !== id && layouts[i.id]) others[i.id] = layouts[i.id] })
    return findFreePosition(DEFAULT_W, DEFAULT_H, others)
  }

  function ensureSaved(id) {
    setLayouts(prev => {
      if (prev[id]) return prev
      const others = {}
      items.forEach(i => { if (i.id !== id && prev[i.id]) others[i.id] = prev[i.id] })
      return { ...prev, [id]: findFreePosition(DEFAULT_W, DEFAULT_H, others) }
    })
  }

  return { layouts, setLayouts, activeCard, setActiveCard, canvasRef, getLayout, ensureSaved, DEFAULT_W, DEFAULT_H }
}
