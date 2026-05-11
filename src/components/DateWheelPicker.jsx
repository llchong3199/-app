import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './DateWheelPicker.css'

const ITEM_H = 44

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function WheelCol({ items, value, onChange, format }) {
  const ref = useRef()
  const debounceRef = useRef()
  const userScrollingRef = useRef(false)

  useEffect(() => {
    if (userScrollingRef.current) return
    const idx = Math.max(0, items.indexOf(value))
    if (ref.current) ref.current.scrollTop = idx * ITEM_H
  }, [value, items])

  function handleScroll() {
    userScrollingRef.current = true
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!ref.current) return
      const idx = Math.round(ref.current.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(items.length - 1, idx))
      userScrollingRef.current = false
      onChange(items[clamped])
    }, 80)
  }

  return (
    <div className="wheel-col-wrap">
      <div className="wheel-col" ref={ref} onScroll={handleScroll}>
        <div style={{ height: ITEM_H * 2 }} />
        {items.map(item => (
          <div key={item} className="wheel-item" style={{ height: ITEM_H }}>
            {format ? format(item) : item}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
      <div className="wheel-grad-top" />
      <div className="wheel-grad-bottom" />
      <div className="wheel-selector" />
    </div>
  )
}

export function MonthWheelPicker({ value, onChange, onClose }) {
  const [y, m] = value.split('-').map(Number)
  const [year, setYear]   = useState(y)
  const [month, setMonth] = useState(m)

  const years  = range(2020, 2035)
  const months = range(1, 12)

  function confirm() {
    onChange(`${year}-${String(month).padStart(2, '0')}`)
    onClose()
  }

  return createPortal(
    <div className="dp-overlay" onClick={onClose}>
      <div className="dp-panel" onClick={e => e.stopPropagation()}>
        <div className="dp-header">
          <button className="dp-cancel" onClick={onClose}>取消</button>
          <span className="dp-title">选择月份</span>
          <button className="dp-confirm" onClick={confirm}>确定</button>
        </div>
        <div className="dp-wheels">
          <WheelCol items={years}  value={year}  onChange={setYear}  format={v => `${v}年`} />
          <WheelCol items={months} value={month} onChange={setMonth} format={v => `${String(v).padStart(2, '0')}月`} />
        </div>
      </div>
    </div>,
    document.body
  )
}

export function DateWheelPicker({ value, onChange, onClose }) {
  const [y, m, d] = value.split('-').map(Number)
  const [year, setYear] = useState(y)
  const [month, setMonth] = useState(m)
  const [day, setDay] = useState(d)

  const years = range(2020, 2030)
  const months = range(1, 12)
  const days = range(1, daysInMonth(year, month))

  useEffect(() => {
    const max = daysInMonth(year, month)
    if (day > max) setDay(max)
  }, [year, month])

  function confirm() {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(dateStr)
    onClose()
  }

  return createPortal(
    <div className="dp-overlay" onClick={onClose}>
      <div className="dp-panel" onClick={e => e.stopPropagation()}>
        <div className="dp-header">
          <button className="dp-cancel" onClick={onClose}>取消</button>
          <span className="dp-title">选择日期</span>
          <button className="dp-confirm" onClick={confirm}>确定</button>
        </div>
        <div className="dp-wheels">
          <WheelCol items={years} value={year} onChange={setYear} format={v => `${v}年`} />
          <WheelCol items={months} value={month} onChange={setMonth} format={v => `${String(v).padStart(2, '0')}月`} />
          <WheelCol items={days} value={day} onChange={setDay} format={v => `${String(v).padStart(2, '0')}日`} />
        </div>
      </div>
    </div>,
    document.body
  )
}
