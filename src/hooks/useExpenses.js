import { useState, useEffect } from 'react'

const DEFAULT_CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '医疗', '住房', '教育', '其他']

export function useExpenses(userId) {
  const storageKey = `et-data-${userId}`

  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey))?.expenses ?? [] }
    catch { return [] }
  })
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey))?.categories ?? DEFAULT_CATEGORIES }
    catch { return DEFAULT_CATEGORIES }
  })
  // Per-month income: { "2026-05": 5000, "2026-04": 4800 }
  // Migration: old data stored monthlyIncome as a single number → move it to current month
  const [incomeByMonth, setIncomeByMonth] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey)) ?? {}
      if (saved.incomeByMonth) return saved.incomeByMonth
      if (typeof saved.monthlyIncome === 'number' && saved.monthlyIncome > 0) {
        const cur = new Date().toISOString().slice(0, 7)
        return { [cur]: saved.monthlyIncome }
      }
      return {}
    } catch { return {} }
  })
  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey))?.budgets ?? {} }
    catch { return {} }
  })
  const [savingsGoals, setSavingsGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey))?.savingsGoals ?? [] }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({
      expenses, categories, incomeByMonth, budgets, savingsGoals,
    }))
  }, [expenses, categories, incomeByMonth, budgets, savingsGoals])

  function addExpense(expense) {
    setExpenses(prev => [{ ...expense, id: Date.now().toString() }, ...prev])
  }
  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }
  function editExpense(id, data) {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data, id: e.id } : e))
  }
  function addCategory(name) {
    const trimmed = name.trim()
    if (trimmed && !categories.includes(trimmed)) setCategories(prev => [...prev, trimmed])
  }
  function deleteCategory(name) {
    setCategories(prev => prev.filter(c => c !== name))
  }

  // Set income for a specific month
  function setIncomeForMonth(yearMonth, amount) {
    setIncomeByMonth(prev => ({ ...prev, [yearMonth]: amount }))
  }

  function setCategoryBudget(category, amount) {
    setBudgets(prev => ({ ...prev, [category]: amount }))
  }

  function addSavingsGoal({ name, emoji, targetAmount }) {
    setSavingsGoals(prev => [...prev, {
      id: Date.now().toString(),
      name, emoji, targetAmount, savedAmount: 0,
    }])
  }
  function deleteSavingsGoal(id) {
    setSavingsGoals(prev => prev.filter(g => g.id !== id))
  }
  function depositToGoal(id, amount) {
    setSavingsGoals(prev => prev.map(g =>
      g.id === id ? { ...g, savedAmount: parseFloat((g.savedAmount + amount).toFixed(2)) } : g
    ))
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyIncome = incomeByMonth[currentMonth] ?? 0   // convenience for piggy/savings

  return {
    expenses, categories, addExpense, deleteExpense, editExpense, addCategory, deleteCategory,
    incomeByMonth, monthlyIncome, setIncomeForMonth,
    budgets, setCategoryBudget,
    savingsGoals, addSavingsGoal, deleteSavingsGoal, depositToGoal,
  }
}
