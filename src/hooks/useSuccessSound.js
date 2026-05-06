import { useCallback } from 'react'

export function useSuccessSound() {
  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const t = ctx.currentTime

      // 基频 + 二次谐波，模拟真实铃声「叮」的泛音
      const freqs = [1318, 2637]
      const gains = [0.45, 0.18]

      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(gains[i], t + 0.005)   // 极短上升
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2)   // 慢衰减
        osc.start(t)
        osc.stop(t + 1.2)
      })
    } catch {
      // AudioContext not supported — silent fallback
    }
  }, [])

  return playSound
}
