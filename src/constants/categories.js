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
  '餐饮': '🍚',
  '交通': '🚗',
  '购物': '🛍️',
  '娱乐': '🎢',
  '医疗': '💉',
  '住房': '🏠',
  '教育': '🎓',
  '其他': '🤷',
}

const DEFAULT_COLOR = '#6366f1'
const DEFAULT_ICON = '💰'

let _customIcons = {}

export function setCustomIcons(map) {
  _customIcons = map ?? {}
}

export function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] ?? DEFAULT_COLOR
}

export function getCategoryIcon(cat) {
  return _customIcons[cat] ?? CATEGORY_ICONS[cat] ?? DEFAULT_ICON
}
