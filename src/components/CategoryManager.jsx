import { useState } from 'react'
import { getCategoryIcon } from '../constants/categories'
import './CategoryManager.css'

export function CategoryManager({ categories, onAdd, onDelete }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (categories.includes(trimmed)) {
      setError('该分类已存在')
      return
    }
    setError('')
    onAdd(trimmed)
    setInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="category-manager">
      <h3>分类管理</h3>
      <div className="category-input-row">
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
            <span>{getCategoryIcon(c)}</span>
            {c}
            <button onClick={() => onDelete(c)} title="删除">×</button>
          </span>
        ))}
      </div>
    </div>
  )
}
