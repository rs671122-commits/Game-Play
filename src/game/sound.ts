class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.12,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playButtonClick() {
    this.playTone(520, 0.055, 'sine', 0.07, 0, 380);
  }

  public playDiceRoll() {
    // Crisp wooden clatter across 4 quick taps
    const freqs = [240, 320, 270, 360];
    freqs.forEach((f, idx) => {
      this.playTone(f, 0.055, 'triangle', 0.08, idx * 0.07, f * 0.72);
    });
  }

  public playSixBonus() {
    this.playTone(523.25, 0.12, 'triangle', 0.1, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.1, 0.07);
    this.playTone(783.99, 0.18, 'sine', 0.11, 0.14);
  }

  public playStepHop(stepIndex: number) {
    const base = 360 + Math.min(stepIndex, 6) * 34;
    this.playTone(base, 0.065, 'triangle', 0.09, 0, base * 0.85);
  }

  public playCapture() {
    this.playTone(220, 0.14, 'sawtooth', 0.08, 0, 95);
    this.playTone(440, 0.12, 'triangle', 0.1, 0.04, 160);
  }

  public playHomeReach() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'sine', 0.1, idx * 0.065);
    });
  }

  public playVictory() {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((n, idx) => {
      this.playTone(n, 0.42, 'triangle', 0.11, idx * 0.085);
    });
  }
}

export const soundEngine = new SoundEngine();
