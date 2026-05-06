import { useState } from 'react'
import { getCategoryIcon } from '../constants/categories'
import { DateWheelPicker } from './DateWheelPicker'
import './ExpenseForm.css'

function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日`
}

export function ExpenseForm({ categories, onAdd }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ amount: '', category: categories[0] ?? '', date: today, note: '' })
  const [error, setError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setError('请输入有效金额')
      return
    }
    if (!form.category) {
      setError('请选择分类')
      return
    }
    setError('')
    onAdd({ ...form, amount })
    setForm(prev => ({ ...prev, amount: '', note: '' }))
  }

  return (
    <>
      {showDatePicker && (
        <DateWheelPicker
          value={form.date}
          onChange={date => setForm(prev => ({ ...prev, date }))}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      <form className="expense-form" onSubmit={handleSubmit}>
        <h2>添加消费</h2>
        <div className="form-row">
          <div className="form-field">
            <label>金额 (¥)</label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={handleChange}
            />
          </div>
          <div className="form-field">
            <label>分类</label>
            <select name="category" value={form.category} onChange={handleChange}>
              {categories.map(c => <option key={c} value={c}>{getCategoryIcon(c)} {c}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>日期</label>
            <button
              type="button"
              className="date-trigger"
              onClick={() => setShowDatePicker(true)}
            >
              <span>{formatDisplayDate(form.date)}</span>
              <span className="date-trigger-icon">📅</span>
            </button>
          </div>
        </div>
        <div className="form-field">
          <label>备注</label>
          <input name="note" type="text" placeholder="可选" value={form.note} onChange={handleChange} />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary">记录</button>
      </form>
    </>
  )
}
