import { useState, useRef, useEffect } from 'react'
import {
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell,
} from 'recharts'
import { getCategoryIcon, getCategoryColor } from '../constants/categories'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import './Charts.css'

const FALLBACK_COLORS = ['#FF6B9D','#56CCF2','#6FCF97','#F2C94C','#9B51E0','#FF8C42','#EB5757','#2D9CDB','#F2994A','#27AE60']

function buildPieData(expenses) {
  const map = {}
  for (const e of expenses) {
    map[e.category] = (map[e.category] ?? 0) + e.amount
  }
  return Object.entries(map).map(([name, value]) => ({
    name,
    label: `${getCategoryIcon(name)} ${name}`,
    value: parseFloat(value.toFixed(2)),
  }))
}

function buildMonthlyData(expenses) {
  const year = new Date().getFullYear()
  return Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`
    const total = expenses
      .filter(e => e.date.startsWith(monthKey))
      .reduce((s, e) => s + e.amount, 0)
    return { month: `${i + 1}月`, monthKey, total: parseFloat(total.toFixed(2)) }
  })
}

function buildDailyData(expenses, monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const days = new Date(year, month, 0).getDate()
  return Array.from({ length: days }, (_, i) => {
    const d = i + 1
    const dayKey = `${monthKey}-${String(d).padStart(2, '0')}`
    const total = expenses
      .filter(e => e.date === dayKey)
      .reduce((s, e) => s + e.amount, 0)
    return { day: `${d}`, total: parseFloat(total.toFixed(2)) }
  })
}

export function Charts({ expenses }) {
  const [drillMonth, setDrillMonth] = useState(null)
  const tickColor  = '#A0407A'
  const gridColor  = 'rgba(255,107,157,0.12)'
  const tooltipStyle = { backgroundColor: '#FFFFFF', border: '1px solid rgba(255,107,157,0.30)', color: '#2D1420', borderRadius: '8px' }

  // ── 饼图拖拽旋转 ──
  const [pieRot, setPieRot] = useState(0)
  const [showLabels, setShowLabels] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ on: false, startY: 0, startRot: 0, vel: 0, prevY: 0, prevT: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPieRot(0)
    setShowLabels(false)
    const t = setTimeout(() => setShowLabels(true), 400)
    return () => clearTimeout(t)
  }, [drillMonth])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  if (expenses.length === 0) {
    return <div className="charts-empty">添加消费记录后，图表将显示在这里</div>
  }

  const filteredExpenses = drillMonth
    ? expenses.filter(e => e.date.startsWith(drillMonth))
    : expenses

  const pieData = buildPieData(filteredExpenses)
  const total = filteredExpenses.reduce((s, e) => s + e.amount, 0)

  function onPieDragStart(y) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    dragRef.current = { on: true, startY: y, startRot: pieRot, vel: 0, prevY: y, prevT: performance.now() }
    setIsDragging(true)
    setShowLabels(false)
  }

  function onPieDragMove(y) {
    if (!dragRef.current.on) return
    const now = performance.now()
    const dt = now - dragRef.current.prevT
    if (dt > 0) dragRef.current.vel = (y - dragRef.current.prevY) / dt * 16 * 1.2
    dragRef.current.prevY = y
    dragRef.current.prevT = now
    setPieRot(dragRef.current.startRot + (y - dragRef.current.startY) * 1.2)
  }

  function onPieDragEnd() {
    if (!dragRef.current.on) return
    dragRef.current.on = false
    setIsDragging(false)
    let v = dragRef.current.vel
    function spin() {
      v *= 0.96
      setPieRot(r => r + v)
      if (Math.abs(v) > 0.3) {
        rafRef.current = requestAnimationFrame(spin)
      } else {
        setShowLabels(true)
      }
    }
    rafRef.current = requestAnimationFrame(spin)
  }

  function handleBarClick(data) {
    if (data?.activePayload?.length) {
      setDrillMonth(data.activePayload[0].payload.monthKey)
    }
  }

  function exportPDF() {
    if (!drillMonth) {
      alert('请先点击柱状图中的某个月份，再导出该月报表')
      return
    }
    const [y, m] = drillMonth.split('-').map(Number)
    const monthExpenses = expenses
      .filter(e => e.date.startsWith(drillMonth))
      .sort((a, b) => a.date.localeCompare(b.date))
    const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0)

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = 210

    // Header
    doc.setFontSize(20)
    doc.setTextColor(192, 48, 106)
    doc.text(`${y}年${m}月 消费报表`, pageW / 2, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`总支出：¥${monthTotal.toFixed(2)}`, pageW / 2, 30, { align: 'center' })

    // Expense table
    const body = monthExpenses.map(e => {
      const [ey, em, ed] = e.date.split('-')
      return [`${em}月${ed}日`, e.category, `¥${e.amount.toFixed(2)}`, e.note || '-']
    })

    doc.autoTable({
      startY: 38,
      head: [['日期', '分类', '金额', '备注']],
      body,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [255, 107, 157],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [255, 245, 248] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    })

    const lastTable = doc.lastAutoTable

    // Category summary
    const catMap = {}
    for (const e of monthExpenses) {
      catMap[e.category] = (catMap[e.category] ?? 0) + e.amount
    }
    const catRows = Object.entries(catMap).map(([cat, amt]) => [cat, `¥${amt.toFixed(2)}`, `${(amt / monthTotal * 100).toFixed(1)}%`])
    catRows.push(['合计', `¥${monthTotal.toFixed(2)}`, '100%'])

    doc.autoTable({
      startY: lastTable.finalY + 10,
      head: [['分类', '金额', '占比']],
      body: catRows,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [255, 107, 157],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [255, 245, 248] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 30, halign: 'right' },
      },
      footStyles: { fontStyle: 'bold', fillColor: [255, 235, 240] },
      margin: { left: 14, right: 14 },
    })

    try {
      doc.save(`${y}-${m}-消费报表.pdf`)
    } catch (e) {
      alert('PDF 导出失败，请检查浏览器是否允许下载文件')
    }
  }

  const monthlyData = buildMonthlyData(expenses)
  const dailyData = drillMonth ? buildDailyData(expenses, drillMonth) : []

  return (
    <div className="charts">
      {/* ── 左：分类饼图 ── */}
      <div className="chart-card chart-card-pie">
        <h3>分类占比{drillMonth ? ` · ${parseInt(drillMonth.slice(5))}月` : ''}</h3>
        <p className="chart-total">合计 ¥{total.toFixed(2)}</p>
        <div className="pie-svg-wrap">
        <svg
          viewBox="-120 -60 500 380"
          style={{ width: '100%', height: 'auto', display: 'block', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}
          onMouseDown={e => { e.preventDefault(); onPieDragStart(e.clientY) }}
          onMouseMove={e => onPieDragMove(e.clientY)}
          onMouseUp={onPieDragEnd}
          onMouseLeave={onPieDragEnd}
          onTouchStart={e => { e.preventDefault(); onPieDragStart(e.touches[0].clientY) }}
          onTouchMove={e => { e.preventDefault(); onPieDragMove(e.touches[0].clientY) }}
          onTouchEnd={onPieDragEnd}
        >
          <defs>
            <filter id="pie-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          </defs>
          {(() => {
            const cx = 130, cy = 130, or = 100, ir = 50
            let startAngle = 0

            // Pass 1: compute geometry for every slice
            const computed = pieData.map((entry, i) => {
              const pct = total > 0 ? entry.value / total : 0
              const angle = pct * 360
              const startRad = (startAngle - 90) * Math.PI / 180
              const endRad   = (startAngle + angle - 90) * Math.PI / 180
              const midRad   = (startAngle + angle / 2 - 90 + pieRot) * Math.PI / 180
              startAngle += angle
              const color   = getCategoryColor(entry.name) || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
              const isRight = Math.cos(midRad) >= 0
              const ex = cx + 118 * Math.cos(midRad)
              const ey = cy + 118 * Math.sin(midRad)
              return { entry, i, pct, angle, startRad, endRad, midRad, color, isRight, ex, ey,
                lsx: cx + or * Math.cos(midRad), lsy: cy + or * Math.sin(midRad) }
            })

            // Pass 2: nudge overlapping labels per side
            const toLabel = computed.filter(c => c.pct >= 0.03).map(c => ({ ...c, labelY: c.ey }))
            ;[false, true].forEach(side => {
              const grp = toLabel.filter(l => l.isRight === side).sort((a, b) => a.labelY - b.labelY)
              for (let j = 1; j < grp.length; j++)
                if (grp[j].labelY - grp[j - 1].labelY < 34) grp[j].labelY = grp[j - 1].labelY + 34
              for (let j = grp.length - 2; j >= 0; j--)
                if (grp[j + 1].labelY - grp[j].labelY < 34) grp[j].labelY = grp[j + 1].labelY - 34
            })
            const lyMap = Object.fromEntries(toLabel.map(l => [l.i, l.labelY]))

            // Pass 3: render
            const slices = computed.map(({ entry, i, pct, angle, startRad, endRad, color }) => {
              if (pct <= 0) return null
              const ox1 = cx + or * Math.cos(startRad), oy1 = cy + or * Math.sin(startRad)
              const ox2 = cx + or * Math.cos(endRad),   oy2 = cy + or * Math.sin(endRad)
              const ix1 = cx + ir * Math.cos(startRad), iy1 = cy + ir * Math.sin(startRad)
              const ix2 = cx + ir * Math.cos(endRad),   iy2 = cy + ir * Math.sin(endRad)
              const la = angle > 180 ? 1 : 0
              return (
                <path key={`s${i}`}
                  d={`M ${ox1} ${oy1} A ${or} ${or} 0 ${la} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${la} 0 ${ix1} ${iy1} Z`}
                  fill={color} stroke="#fff" strokeWidth={1.5} filter="url(#pie-shadow)" />
              )
            })

            const labels = computed.map(({ entry, i, pct, isRight, ex, ey, lsx, lsy, color }) => {
              if (pct < 0.03) return null
              const labelY = lyMap[i] ?? ey
              const lx     = ex + (isRight ? 32 : -32)
              const tx     = lx + (isRight ? 4 : -4)
              const anchor = isRight ? 'start' : 'end'
              const amt    = entry.value >= 10000
                ? `¥${(entry.value / 10000).toFixed(1)}w`
                : `¥${entry.value.toFixed(0)}`
              return (
                <g key={`l${i}`}>
                  <polyline points={`${lsx},${lsy} ${ex},${ey} ${lx},${labelY}`}
                    fill="none" stroke={color} strokeWidth={1.2} opacity="0.6" />
                  <circle cx={lsx} cy={lsy} r="2.5" fill={color} opacity="0.55" />
                  <text x={tx} y={labelY - 7} textAnchor={anchor} fill={color} fontSize="15" fontWeight="700">
                    {getCategoryIcon(entry.name)} {entry.name}
                  </text>
                  <text x={tx} y={labelY + 14} textAnchor={anchor} fill="var(--text-3)" fontSize="13">
                    {(pct * 100).toFixed(1)}%  {amt}
                  </text>
                </g>
              )
            })

            return (
              <>
                <g transform={`rotate(${pieRot} 130 130)`}>
                  <g key={drillMonth ?? 'all'} style={{ transformOrigin: '130px 130px', animation: 'pieEnter 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                    {slices}
                  </g>
                </g>
                <g style={{ opacity: showLabels ? 1 : 0, transition: showLabels ? 'opacity 0.5s ease 0.2s' : 'opacity 0.12s ease' }}>
                  {labels}
                </g>
                <circle cx="130" cy="130" r="42" fill="var(--surface)" stroke="var(--border-2)" strokeWidth="1" />
                <text x="130" y="124" textAnchor="middle" fill="var(--text-3)" fontSize="11" fontWeight="500">总计</text>
                <text x="130" y="146" textAnchor="middle" fill="var(--gold-deep)" fontSize="16" fontWeight="800">¥{total.toFixed(0)}</text>
              </>
            )
          })()}
        </svg>
        </div>
      </div>

      {/* ── 右：月度 / 每日柱状图 ── */}
      <div className="chart-card">
        {drillMonth ? (
          <>
            <div className="chart-card-header">
              <button className="chart-back-btn" onClick={() => setDrillMonth(null)}>← 返回</button>
              <h3>{parseInt(drillMonth.slice(5))}月 每日消费</h3>
              <button className="chart-pdf-btn" onClick={exportPDF}>📄 导出 PDF</button>
            </div>
          </>
        ) : (
          <></>
        )}
        {drillMonth ? (
          <>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={dailyData} margin={{ top: 16, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: tickColor }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip formatter={v => `¥${v}`} contentStyle={tooltipStyle} />
                <Bar dataKey="total" fill="#FF6B9D" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <>
            <h3>月度趋势</h3>
            <p className="chart-hint">点击月份可查看每日明细</p>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={monthlyData}
                style={{ cursor: 'pointer' }}
                onClick={handleBarClick}
                margin={{ top: 16, right: 4, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} />
                <YAxis tick={{ fontSize: 12, fill: tickColor }} />
                <Tooltip formatter={v => `¥${v}`} contentStyle={tooltipStyle} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.total > 0 ? '#FF6B9D' : 'rgba(255,107,157,0.15)'}
                      fillOpacity={entry.total > 0 ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  )
}
