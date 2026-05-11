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
  const [loans, setLoans] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey))?.loans ?? [] }
    catch { return [] }
  })
  const [fixedExpenses, setFixedExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey))?.fixedExpenses ?? [] }
    catch { return [] }
  })
  const [categoryIcons, setCategoryIcons] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey))?.categoryIcons ?? {} }
    catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({
      expenses, categories, incomeByMonth, budgets, savingsGoals, loans, fixedExpenses, categoryIcons,
    }))
  }, [expenses, categories, incomeByMonth, budgets, savingsGoals, loans, fixedExpenses, categoryIcons])

  function addExpense(expense) {
    setExpenses(prev => [{ ...expense, id: Date.now().toString() }, ...prev])
  }
  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }
  function editExpense(id, data) {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data, id: e.id } : e))
  }
  function addCategory(name, icon = '') {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    setCategories(prev => [...prev, trimmed])
    if (icon) setCategoryIcons(prev => ({ ...prev, [trimmed]: icon }))
  }
  function deleteCategory(name) {
    setCategories(prev => prev.filter(c => c !== name))
    setCategoryIcons(prev => { const n = { ...prev }; delete n[name]; return n })
  }

  // Set income for a specific month
  function setIncomeForMonth(yearMonth, amount) {
    setIncomeByMonth(prev => ({ ...prev, [yearMonth]: amount }))
  }

  function setCategoryBudget(category, amount) {
    setBudgets(prev => ({ ...prev, [category]: amount }))
  }

  function addSavingsGoal({ name, emoji, targetAmount, targetDate }) {
    const goal = { id: Date.now().toString(), name, emoji, targetAmount, savedAmount: 0 }
    if (targetDate) goal.targetDate = targetDate
    setSavingsGoals(prev => [...prev, goal])
  }
  function deleteSavingsGoal(id) {
    setSavingsGoals(prev => prev.filter(g => g.id !== id))
  }
  function depositToGoal(id, amount) {
    setSavingsGoals(prev => prev.map(g =>
      g.id === id ? { ...g, savedAmount: parseFloat(Math.min(g.targetAmount, g.savedAmount + amount).toFixed(2)) } : g
    ))
  }

  function addLoan({ name, emoji, totalAmount, monthlyPayment, startDate, endDate }) {
    const loanId = Date.now().toString()
    const fixedId = (Date.now() + 1).toString()
    const loan = { id: loanId, name, emoji, totalAmount, monthlyPayment, paidAmount: 0, fixedExpenseId: fixedId }
    if (startDate) loan.startDate = startDate
    if (endDate) loan.endDate = endDate
    setLoans(prev => [...prev, loan])
    setFixedExpenses(prev => [...prev, { id: fixedId, name, emoji, amount: monthlyPayment, fromLoan: true }])
  }
  function deleteLoan(id) {
    let fixedId = null
    setLoans(prev => {
      const loan = prev.find(l => l.id === id)
      if (loan?.fixedExpenseId) fixedId = loan.fixedExpenseId
      return prev.filter(l => l.id !== id)
    })
    if (fixedId) setFixedExpenses(prev => prev.filter(f => f.id !== fixedId))
  }
  function payLoan(id, amount) {
    let fixedIdToRemove = null
    setLoans(prev => prev.map(l => {
      if (l.id !== id) return l
      const newPaid = parseFloat(Math.min(l.totalAmount, l.paidAmount + amount).toFixed(2))
      if (newPaid >= l.totalAmount && l.fixedExpenseId) {
        fixedIdToRemove = l.fixedExpenseId
        return { ...l, paidAmount: newPaid, fixedExpenseId: null }
      }
      return { ...l, paidAmount: newPaid }
    }))
    if (fixedIdToRemove) setFixedExpenses(prev => prev.filter(f => f.id !== fixedIdToRemove))
  }

  function addFixedExpense({ name, emoji, amount }) {
    setFixedExpenses(prev => [...prev, { id: Date.now().toString(), name, emoji, amount }])
  }
  function deleteFixedExpense(id) {
    setFixedExpenses(prev => prev.filter(f => f.id !== id))
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyIncome = incomeByMonth[currentMonth] ?? 0   // convenience for piggy/savings

  return {
    expenses, categories, categoryIcons, addExpense, deleteExpense, editExpense, addCategory, deleteCategory,
    incomeByMonth, monthlyIncome, setIncomeForMonth,
    budgets, setCategoryBudget,
    savingsGoals, addSavingsGoal, deleteSavingsGoal, depositToGoal,
    loans, addLoan, deleteLoan, payLoan,
    fixedExpenses, addFixedExpense, deleteFixedExpense,
  }
}
