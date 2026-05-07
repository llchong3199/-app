import { useState } from 'react'
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

  if (expenses.length === 0) {
    return <div className="charts-empty">添加消费记录后，图表将显示在这里</div>
  }

  const filteredExpenses = drillMonth
    ? expenses.filter(e => e.date.startsWith(drillMonth))
    : expenses

  const pieData = buildPieData(filteredExpenses)
  const total = filteredExpenses.reduce((s, e) => s + e.amount, 0)

  function handleBarClick(data) {
    if (data?.activePayload?.length) {
      setDrillMonth(data.activePayload[0].payload.monthKey)
    }
  }

  function exportPDF() {
    if (!drillMonth) return
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

    doc.save(`${y}-${m}-消费报表.pdf`)
  }

  const monthlyData = buildMonthlyData(expenses)
  const dailyData = drillMonth ? buildDailyData(expenses, drillMonth) : []

  return (
    <div className="charts">
      {/* ── 左：分类饼图 ── */}
      <div className="chart-card">
        <h3>分类占比{drillMonth ? ` · ${parseInt(drillMonth.slice(5))}月` : ''}</h3>
        <p className="chart-total">合计 ¥{total.toFixed(2)}</p>
        <div style={{ textAlign: 'center', padding: '4px 0', position: 'relative' }}>
          <svg viewBox="0 0 260 260" style={{ width: 220, height: 220, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.06))' }}>
            <defs>
              <filter id="pie-shadow">
                <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.15" />
              </filter>
            </defs>
            <g style={{ transformOrigin: '130px 130px', animation: 'pieEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
              {(() => {
                const cx = 130, cy = 130, or = 100, ir = 50
                let startAngle = 0
                return pieData.map((entry, i) => {
                  const pct = total > 0 ? entry.value / total : 0
                  const angle = pct * 360
                  const startRad = (startAngle - 90) * Math.PI / 180
                  const endRad = (startAngle + angle - 90) * Math.PI / 180
                  const ox1 = cx + or * Math.cos(startRad)
                  const oy1 = cy + or * Math.sin(startRad)
                  const ox2 = cx + or * Math.cos(endRad)
                  const oy2 = cy + or * Math.sin(endRad)
                  const ix1 = cx + ir * Math.cos(startRad)
                  const iy1 = cy + ir * Math.sin(startRad)
                  const ix2 = cx + ir * Math.cos(endRad)
                  const iy2 = cy + ir * Math.sin(endRad)
                  const largeArc = angle > 180 ? 1 : 0
                  const color = getCategoryColor(entry.name) || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                  const seg = pct > 0 ? (
                    <path
                      key={i}
                      d={`M ${ox1} ${oy1} A ${or} ${or} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${largeArc} 0 ${ix1} ${iy1} Z`}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={1.5}
                      filter="url(#pie-shadow)"
                    />
                  ) : null
                  startAngle += angle
                  return seg
                })
              })()}
            </g>
            <circle cx="130" cy="130" r="42" fill="var(--surface)" stroke="var(--border-2)" strokeWidth="1" />
            <text x="130" y="124" textAnchor="middle" fill="var(--text-3)" fontSize="11" fontWeight="500">总计</text>
            <text x="130" y="146" textAnchor="middle" fill="var(--gold-deep)" fontSize="16" fontWeight="800">¥{total.toFixed(0)}</text>
          </svg>
        </div>
        <div className="pie-legend">
          {pieData.map((entry, i) => (
            <div key={i} className="pie-legend-item">
              <span className="pie-legend-dot" style={{ background: getCategoryColor(entry.name) || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }} />
              <span className="pie-legend-icon">{getCategoryIcon(entry.name)}</span>
              <span className="pie-legend-name">{entry.name}</span>
              <span className="pie-legend-value">¥{entry.value.toFixed(2)}</span>
              <span className="pie-legend-pct">{(entry.value / total * 100).toFixed(1)}%</span>
            </div>
          ))}
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
            <ResponsiveContainer width="100%" height={260}>
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
            <ResponsiveContainer width="100%" height={260}>
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
