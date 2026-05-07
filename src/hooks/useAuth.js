import { useState } from 'react'

const USERS_KEY = 'et-users'
const SESSION_KEY = 'et-session'

const DEFAULT_AVATARS = ['😊','🎯','🌟','🎮','🦁','🐯','🦊','🐼']

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) ?? [] }
  catch { return [] }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function useAuth() {
  const [users, setUsers] = useState(loadUsers)

  const [currentUser, setCurrentUser] = useState(() => {
    const savedId = sessionStorage.getItem(SESSION_KEY)
    if (!savedId) return null
    return loadUsers().find(u => u.id === savedId) ?? null
  })

  async function login(username, password) {
    const all = loadUsers()
    const user = all.find(u => u.username === username)
    if (!user) throw new Error('用户名不存在')
    const hash = await hashPassword(password)
    if (hash !== user.passwordHash) throw new Error('密码错误')
    sessionStorage.setItem(SESSION_KEY, user.id)
    setCurrentUser(user)
  }

  async function register(username, password) {
    const all = loadUsers()
    if (all.find(u => u.username === username)) throw new Error('用户名已被使用')
    const passwordHash = await hashPassword(password)
    const avatar = DEFAULT_AVATARS[all.length % DEFAULT_AVATARS.length]
    const newUser = { id: Date.now().toString(), username, passwordHash, avatar }
    const updated = [...all, newUser]
    saveUsers(updated)
    setUsers(updated)
    sessionStorage.setItem(SESSION_KEY, newUser.id)
    setCurrentUser(newUser)
  }

  function updateUserAvatar(userId, avatar) {
    const all = loadUsers()
    const updated = all.map(u => u.id === userId ? { ...u, avatar } : u)
    saveUsers(updated)
    setUsers(updated)
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, avatar }))
    }
  }

  async function verifyPassword(userId, password) {
    const all = loadUsers()
    const user = all.find(u => u.id === userId)
    if (!user) throw new Error('用户不存在')
    const hash = await hashPassword(password)
    if (hash !== user.passwordHash) throw new Error('密码错误')
  }

  function deleteAccountById(userId) {
    const all = loadUsers()
    const updated = all.filter(u => u.id !== userId)
    saveUsers(updated)
    localStorage.removeItem(`et-data-${userId}`)
    setUsers(updated)
  }

  async function deleteAccount(userId, password) {
    await verifyPassword(userId, password)
    deleteAccountById(userId)
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
  }

  return { users, currentUser, login, register, updateUserAvatar, verifyPassword, deleteAccountById, deleteAccount, logout }
}
