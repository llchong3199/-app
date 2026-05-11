import { useState } from 'react'
import { getCategoryIcon } from '../constants/categories'
import './CategoryManager.css'

export function CategoryManager({ categories, categoryIcons = {}, onAdd, onDelete }) {
  const [input, setInput] = useState('')
  const [iconInput, setIconInput] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (categories.includes(trimmed)) {
      setError('该分类已存在')
      return
    }
    setError('')
    onAdd(trimmed, iconInput.trim())
    setInput('')
    setIconInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleAdd()
  }

  function getIcon(c) {
    return categoryIcons[c] || getCategoryIcon(c)
  }

  return (
    <div className="category-manager">
      <h3>分类管理</h3>
      <div className="category-input-row">
        <div className="cat-icon-box">
          <span className="cat-icon-display">{iconInput || '🏷️'}</span>
          <input
            className="cat-icon-input"
            type="text"
            value={iconInput}
            onChange={e => setIconInput(e.target.value)}
            maxLength={4}
            onKeyDown={handleKey}
          />
        </div>
        <input
          type="text"
          placeholder="添加新分类"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button onClick={handleAdd}>添加</button>
      </div>
      {error && <p className="cat-error">{error}</p>}
      <div className="category-tags">
        {categories.map(c => (
          <span key={c} className="category-tag">
            <span>{getIcon(c)}</span>
            {c}
            <button onClick={() => onDelete(c)} title="删除">×</button>
          </span>
        ))}
      </div>
    </div>
  )
}
