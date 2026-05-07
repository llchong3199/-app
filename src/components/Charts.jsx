import { useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList,
} from 'recharts'
import { getCategoryIcon, getCategoryColor } from '../constants/categories'
import './Charts.css'

const FALLBACK_COLORS = ['#D4AF37','#f97316','#3b82f6','#ec4899','#a855f7','#ef4444','#14b8a6','#10b981','#6b7280','#F0C968']

function useDarkMode() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

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
  const dark = useDarkMode()
  const tickColor = dark ? '#F0C968' : '#7A5A2A'
  const gridColor = dark ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.20)'
  const tooltipStyle = dark
    ? { backgroundColor: '#221C0A', border: '1px solid rgba(212,175,55,0.3)', color: '#FFF7E1', borderRadius: '8px' }
    : { backgroundColor: '#FFFCF2', border: '1px solid rgba(212,175,55,0.3)', color: '#3D2B0A', borderRadius: '8px' }

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

  const monthlyData = buildMonthlyData(expenses)
  const dailyData = drillMonth ? buildDailyData(expenses, drillMonth) : []

  return (
    <div className="charts">
      {/* ── 左：分类饼图 ── */}
      <div className="chart-card">
        <h3>分类占比{drillMonth ? ` · ${parseInt(drillMonth.slice(5))}月` : ''}</h3>
        <p className="chart-total">合计 ¥{total.toFixed(2)}</p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="label"
              cx="50%" cy="50%"
              outerRadius={88}
              label={({ name, percent }) => `${getCategoryIcon(name)} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: tickColor }}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={getCategoryColor(entry.name) || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, name) => [`¥${v}`, name]} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── 右：月度 / 每日柱状图 ── */}
      <div className="chart-card">
        {drillMonth ? (
          <>
            <div className="chart-card-header">
              <button className="chart-back-btn" onClick={() => setDrillMonth(null)}>← 返回</button>
              <h3>{parseInt(drillMonth.slice(5))}月 每日消费</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData} margin={{ top: 16, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: tickColor }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip formatter={v => `¥${v}`} contentStyle={tooltipStyle} />
                <Bar dataKey="total" fill="#D4AF37" radius={[3, 3, 0, 0]} />
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
                      fill={entry.total > 0 ? '#D4AF37' : (dark ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.15)')}
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
