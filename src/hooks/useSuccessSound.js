import { useRef, useCallback } from 'react'

// E5 → G#5 → B5 ascending arpeggio
const NOTES = [
  { freq: 659.3, delay: 0,    duration: 0.4 },
  { freq: 830.6, delay: 0.13, duration: 0.4 },
  { freq: 987.8, delay: 0.26, duration: 0.5 },
]

export function useSuccessSound() {
  const ctxRef = useRef(null)

  return useCallback(() => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = ctxRef.current

      function play() {
        const now = ctx.currentTime
        NOTES.forEach(({ freq, delay, duration }) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)

          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, now + delay)

          const t0 = now + delay
          gain.gain.setValueAtTime(0, t0)
          gain.gain.linearRampToValueAtTime(0.5, t0 + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)

          osc.start(t0)
          osc.stop(t0 + duration)
        })
      }

      if (ctx.state === 'suspended') {
        ctx.resume().then(play).catch(e => console.error('[sound] resume failed', e))
      } else {
        play()
      }
    } catch (e) {
      console.error('[sound] failed', e)
    }
  }, [])
}
