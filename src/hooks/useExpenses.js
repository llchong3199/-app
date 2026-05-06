import { useState, useEffect } from 'react'

const DEFAULT_CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '医疗', '住房', '教育', '其他']

const STORAGE_KEY = 'expense-tracker-data'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function useExpenses() {
  const saved = loadData()

  const [expenses, setExpenses] = useState(saved?.expenses ?? [])
  const [categories, setCategories] = useState(saved?.categories ?? DEFAULT_CATEGORIES)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses, categories }))
  }, [expenses, categories])

  function addExpense(expense) {
    setExpenses(prev => [{ ...expense, id: Date.now().toString() }, ...prev])
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  function addCategory(name) {
    const trimmed = name.trim()
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed])
    }
  }

  function deleteCategory(name) {
    setCategories(prev => prev.filter(c => c !== name))
  }

  return { expenses, categories, addExpense, deleteExpense, addCategory, deleteCategory }
}
