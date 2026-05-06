import { getCategoryColor, getCategoryIcon } from '../constants/categories'
import './ExpenseList.css'

const ICON_SIZES = [18, 22, 27, 33, 40]

function getAmountLevel(amount) {
  if (amount >= 1000) return 4
  if (amount >= 500) return 3
  if (amount >= 300) return 2
  if (amount >= 100) return 1
  return 0
}

export function ExpenseList({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return <div className="expense-list-empty">暂无记录，添加第一笔消费吧！</div>
  }

  return (
    <div className="expense-list">
      {expenses.map((e, idx) => {
        const level = getAmountLevel(e.amount)
        const iconSize = ICON_SIZES[level]
        const color = getCategoryColor(e.category)

        return (
          <div
            key={e.id}
            className="expense-item"
            style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
          >
            <div className="expense-icon-col">
              <span
                className="expense-main-icon"
                style={{ fontSize: iconSize }}
              >
                {getCategoryIcon(e.category)}
              </span>
            </div>
            <span
              className="expense-tag"
              style={{ background: color + '22', color }}
            >
              {e.category}
            </span>
            <div className="expense-info">
              <span className="expense-note">{e.note || '无备注'}</span>
              <span className="expense-date">{e.date}</span>
            </div>
            <span className="expense-amount">¥{e.amount.toFixed(2)}</span>
            <button className="expense-delete" onClick={() => onDelete(e.id)} title="删除">×</button>
          </div>
        )
      })}
    </div>
  )
}
