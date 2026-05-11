import { useState } from 'react'
import { createPortal } from 'react-dom'
import { getCategoryColor, getCategoryIcon } from '../constants/categories'
import { DateWheelPicker } from './DateWheelPicker'
import './ExpenseList.css'


function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

function EditModal({ expense, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    amount: expense.amount.toString(),
    category: expense.category,
    date: expense.date,
    note: expense.note || '',
  })
  const [error, setError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.amount || isNaN(amount) || amount <= 0) { setError('请输入有效金额'); return }
    onSave({ ...expense, ...form, amount })
    onClose()
  }

  return createPortal(
    <>
      {showDatePicker && (
        <DateWheelPicker
          value={form.date}
          onChange={date => setForm(prev => ({ ...prev, date }))}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      <div className="edit-overlay" onClick={onClose}>
        <div className="edit-panel" onClick={e => e.stopPropagation()}>
          <div className="edit-header">
            <span>编辑消费</span>
            <button className="edit-close" onClick={onClose}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="edit-row">
              <div className="edit-field">
                <label>金额 (¥)</label>
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  autoFocus
                />
              </div>
              <div className="edit-field">
                <label>分类</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {categories.map(c => <option key={c} value={c}>{getCategoryIcon(c)} {c}</option>)}
                </select>
              </div>
            </div>
            <div className="edit-field">
              <label>日期</label>
              <button
                type="button"
                className="edit-date-trigger"
                onClick={() => setShowDatePicker(true)}
              >
                <span>{formatDisplayDate(form.date)}</span>
                <span className="date-cal-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
              </button>
            </div>
            <div className="edit-field">
              <label>备注</label>
              <input name="note" type="text" placeholder="可选" value={form.note} onChange={handleChange} />
            </div>
            {error && <p className="edit-error">{error}</p>}
            <div className="edit-actions">
              <button type="button" className="edit-cancel-btn" onClick={onClose}>取消</button>
              <button type="submit" className="edit-save-btn">保存</button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  )
}

export function ExpenseList({ expenses, categories, onDelete, onEdit }) {
  const [editingId, setEditingId] = useState(null)

  if (expenses.length === 0) {
    return <div className="expense-list-empty">暂无记录，添加第一笔消费吧！</div>
  }

  const editingExpense = editingId ? expenses.find(e => e.id === editingId) : null

  return (
    <>
      {editingExpense && (
        <EditModal
          expense={editingExpense}
          categories={categories}
          onSave={data => { onEdit(editingExpense.id, data); setEditingId(null) }}
          onClose={() => setEditingId(null)}
        />
      )}
      <div className="expense-list">
        {expenses.map((e, idx) => {
          const color = getCategoryColor(e.category)

          return (
            <div
              key={e.id}
              className="expense-item"
              style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
            >
              <div className="expense-icon-col" style={{ background: color + '18', borderColor: color + '33' }}>
                <span className="expense-main-icon">
                  {getCategoryIcon(e.category)}
                </span>
                <span className="expense-icon-label" style={{ color }}>{e.category}</span>
              </div>
              <div className="expense-info">
                <span className="expense-note">{e.note || '无备注'}</span>
                <span className="expense-date">{e.date}</span>
              </div>
              <span className="expense-amount">¥{e.amount.toFixed(2)}</span>
              <button className="expense-edit" onClick={() => setEditingId(e.id)} title="编辑">✏️</button>
              <button className="expense-delete" onClick={() => onDelete(e.id)} title="删除">×</button>
            </div>
          )
        })}
      </div>
    </>
  )
}
