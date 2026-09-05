class RingtonePlayer {
  private ctx: AudioContext | null = null
  private isRinging = false
  private timer: any = null

  start() {
    if (this.isRinging) return
    this.isRinging = true
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    this.ctx = new AudioCtx()

    const playRingCycle = () => {
      if (!this.isRinging || !this.ctx) return

      try {
        const now = this.ctx.currentTime
        const osc1 = this.ctx.createOscillator()
        const osc2 = this.ctx.createOscillator()
        const gainNode = this.ctx.createGain()

        osc1.type = 'sine'
        osc2.type = 'sine'
        osc1.frequency.setValueAtTime(440, now) // 440 Hz
        osc2.frequency.setValueAtTime(480, now) // 480 Hz

        // Ring for 2.0 seconds with fade in/out
        gainNode.gain.setValueAtTime(0, now)
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.1)
        gainNode.gain.setValueAtTime(0.15, now + 1.9)
        gainNode.gain.linearRampToValueAtTime(0, now + 2.0)

        osc1.connect(gainNode)
        osc2.connect(gainNode)
        gainNode.connect(this.ctx.destination)

        osc1.start(now)
        osc2.start(now)
        osc1.stop(now + 2.0)
        osc2.stop(now + 2.0)
      } catch {}

      this.timer = setTimeout(playRingCycle, 4000)
    }

    playRingCycle()
  }

  stop() {
    this.isRinging = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.ctx) {
      try { this.ctx.close() } catch {}
      this.ctx = null
    }
  }
}

export const ringtone = new RingtonePlayer()
