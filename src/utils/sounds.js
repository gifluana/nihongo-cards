// sounds.js — Web Audio engine (zero external files) + TTS

const AudioCtxClass = window.AudioContext || window.webkitAudioContext
let _ctx = null

function ctx() {
  if (!_ctx) _ctx = new AudioCtxClass()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => ctx(), { once: true })
}

export function playSound(type) {
  try {
    const c = ctx()

    switch (type) {

      case 'flip': {
        const buf  = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++)
          data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / data.length)
        const src = c.createBufferSource()
        const bpf = c.createBiquadFilter()
        const g   = c.createGain()
        bpf.type = 'bandpass'; bpf.frequency.value = 800; bpf.Q.value = 0.8
        src.buffer = buf
        src.connect(bpf); bpf.connect(g); g.connect(c.destination)
        g.gain.setValueAtTime(0.18, c.currentTime)
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12)
        src.start(); src.stop(c.currentTime + 0.13)
        break
      }

      case 'correct': {
        [[0, 660], [90, 990]].forEach(([delay, freq]) => {
          const o = c.createOscillator(), g = c.createGain()
          o.connect(g); g.connect(c.destination)
          o.type = 'sine'; o.frequency.value = freq
          const t = c.currentTime + delay / 1000
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.20, t + 0.01)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
          o.start(t); o.stop(t + 0.29)
        })
        break
      }

      case 'incorrect': {
        const o = c.createOscillator(), g = c.createGain()
        o.connect(g); g.connect(c.destination)
        o.type = 'sine'
        o.frequency.setValueAtTime(380, c.currentTime)
        o.frequency.exponentialRampToValueAtTime(160, c.currentTime + 0.22)
        g.gain.setValueAtTime(0.18, c.currentTime)
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.24)
        o.start(); o.stop(c.currentTime + 0.25)
        break
      }

      case 'tap': {
        const buf  = c.createBuffer(1, c.sampleRate * 0.035, c.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++)
          data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
        const src = c.createBufferSource()
        const hpf = c.createBiquadFilter()
        const g   = c.createGain()
        hpf.type = 'highpass'; hpf.frequency.value = 2600
        src.buffer = buf
        src.connect(hpf); hpf.connect(g); g.connect(c.destination)
        g.gain.setValueAtTime(0.10, c.currentTime)
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.035)
        src.start(); src.stop(c.currentTime + 0.04)
        break
      }

      case 'complete': {
        [[0, 523], [100, 659], [200, 784], [340, 1047]].forEach(([delay, freq]) => {
          const o = c.createOscillator(), g = c.createGain()
          o.connect(g); g.connect(c.destination)
          o.type = 'sine'; o.frequency.value = freq
          const t = c.currentTime + delay / 1000
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.15, t + 0.02)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
          o.start(t); o.stop(t + 0.51)
        })
        break
      }

      case 'open': {
        [[0, 392], [110, 523], [220, 659], [360, 784]].forEach(([delay, freq]) => {
          const o = c.createOscillator(), g = c.createGain()
          o.connect(g); g.connect(c.destination)
          o.type = 'sine'; o.frequency.value = freq
          const t = c.currentTime + delay / 1000
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.12, t + 0.02)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48)
          o.start(t); o.stop(t + 0.49)
        })
        break
      }

      case 'save': {
        const o = c.createOscillator(), g = c.createGain()
        o.connect(g); g.connect(c.destination)
        o.type = 'triangle'
        o.frequency.setValueAtTime(900, c.currentTime)
        o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.08)
        g.gain.setValueAtTime(0, c.currentTime)
        g.gain.linearRampToValueAtTime(0.10, c.currentTime + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.14)
        o.start(); o.stop(c.currentTime + 0.15)
        break
      }

      case 'delete': {
        const o = c.createOscillator(), g = c.createGain()
        o.connect(g); g.connect(c.destination)
        o.type = 'sine'
        o.frequency.setValueAtTime(180, c.currentTime)
        o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.12)
        g.gain.setValueAtTime(0.14, c.currentTime)
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.14)
        o.start(); o.stop(c.currentTime + 0.15)
        break
      }

      default: break
    }
  } catch(e) { /* silent fail */ }
}

export function speakJapanese(text) {
  if (!window.speechSynthesis || !text) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ja-JP'
  utt.rate = 0.85
  utt.pitch = 1.0
  const voices = window.speechSynthesis.getVoices()
  const jpVoice = voices.find(v => v.lang.startsWith('ja'))
  if (jpVoice) utt.voice = jpVoice
  window.speechSynthesis.speak(utt)
}

if (window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {})
}