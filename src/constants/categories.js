export const CATEGORY_COLORS = {
  '餐饮': '#f97316',
  '交通': '#3b82f6',
  '购物': '#ec4899',
  '娱乐': '#a855f7',
  '医疗': '#ef4444',
  '住房': '#14b8a6',
  '教育': '#f59e0b',
  '其他': '#6b7280',
}

export const CATEGORY_ICONS = {
  '餐饮': '😋',   // 好吃到流口水
  '交通': '😤',   // 堵车烦躁
  '购物': '😍',   // 剁手上头
  '娱乐': '😆',   // 快乐摆烂
  '医疗': '🤒',   // 生病痛苦
  '住房': '😌',   // 在家舒服
  '教育': '🤓',   // 学习模式
  '其他': '🤷',   // 说不清楚
}

const DEFAULT_COLOR = '#6366f1'
const DEFAULT_ICON = '💰'

export function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] ?? DEFAULT_COLOR
}

export function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat] ?? DEFAULT_ICON
}
