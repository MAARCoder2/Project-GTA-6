class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineNoise: AudioBufferSourceNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isInitialized = false;
  private isMuted = false;

  public init(): void {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initEngineAudio();
      this.initSirenAudio();
      this.initAmbientAudio();

      this.isInitialized = true;
    } catch {
      // AudioContext unavailable or blocked by browser policy until gesture
    }
  }

  public resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number): void {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime, 0.05);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.setVolume(muted ? 0 : 0.7);
  }

  private initEngineAudio(): void {
    if (!this.ctx || !this.masterGain) return;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start();
  }

  private initSirenAudio(): void {
    if (!this.ctx || !this.masterGain) return;
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.setValueAtTime(650, this.ctx.currentTime);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);
    this.sirenOsc.start();
  }

  private initAmbientAudio(): void {
    if (!this.ctx || !this.masterGain) return;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    osc.start();
  }

  public updateEngineSound(speedRatio: number, isDriving: boolean): void {
    if (!this.ctx || !this.engineGain || !this.engineOsc) return;
    if (!isDriving) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      return;
    }

    const baseGain = 0.22;
    const targetGain = baseGain + speedRatio * 0.18;
    const targetFreq = 45 + speedRatio * 180;

    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
  }

  public updateSirenSound(active: boolean, distanceToPlayer = 0): void {
    if (!this.ctx || !this.sirenGain || !this.sirenOsc) return;
    if (!active) {
      this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      return;
    }

    // Siren pitch modulation (wail)
    const time = this.ctx.currentTime;
    const cycle = (Math.sin(time * 3.5) + 1) * 0.5; // 0 to 1
    const freq = 600 + cycle * 420;
    this.sirenOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);

    // Distance attenuation
    const vol = Math.max(0, 0.28 * (1 - Math.min(1, distanceToPlayer / 70)));
    this.sirenGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
  }

  public playGunshot(weaponType: 'PISTOL' | 'SMG' | 'SHOTGUN'): void {
    if (!this.ctx || !this.masterGain) return;
    this.resumeContext();

    const now = this.ctx.currentTime;

    // Transient impulse noise
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(weaponType === 'SHOTGUN' ? 600 : 1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + (weaponType === 'SHOTGUN' ? 0.2 : 0.12));

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start(now);

    // Low-end punch
    const punchOsc = this.ctx.createOscillator();
    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(weaponType === 'SHOTGUN' ? 180 : 130, now);
    punchOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    const punchGain = this.ctx.createGain();
    punchGain.gain.setValueAtTime(0.6, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    punchOsc.connect(punchGain);
    punchGain.connect(this.masterGain);

    punchOsc.start(now);
    punchOsc.stop(now + 0.2);
  }

  public playCollisionImpact(speed: number): void {
    if (!this.ctx || !this.masterGain) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const intensity = Math.min(1, speed / 25);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playTireScreech(): void {
    if (!this.ctx || !this.masterGain) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  public playFootstep(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playUIBlip(type: 'SELECT' | 'CONFIRM' | 'ALERT' | 'SUCCESS'): void {
    if (!this.ctx || !this.masterGain) return;
    this.resumeContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'SUCCESS') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'ALERT') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(700, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'CONFIRM' ? 660 : 440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
  }
}

export const gameAudio = new ProceduralAudioEngine();
