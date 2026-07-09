/**
 * SoundManager Module - Short procedural SFX via the Web Audio API.
 * No audio asset files — every cue is synthesized on the fly, so there's
 * nothing to host or license.
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('foodEmpireSoundEnabled') !== 'false';
    }

    // AudioContext must be created/resumed from a user gesture on most
    // browsers, so it's built lazily on first play() rather than at startup.
    ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    isEnabled() {
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('foodEmpireSoundEnabled', enabled ? 'true' : 'false');
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    // One short tone. startOffset/duration are in seconds, relative to now.
    tone(freq, startOffset, duration, type = 'sine', gainPeak = 0.15) {
        const ctx = this.ensureContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + startOffset;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
    }

    // Short filtered noise burst — the page-flip cue.
    noiseTick(duration = 0.06, gainPeak = 0.08) {
        const ctx = this.ensureContext();
        if (!ctx) return;
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        const gain = ctx.createGain();
        gain.gain.value = gainPeak;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
    }

    play(name) {
        if (!this.enabled) return;
        try {
            switch (name) {
                case 'sale':
                    // Soft ascending two-note blip — a day that sold something.
                    this.tone(660, 0, 0.12, 'sine', 0.12);
                    this.tone(880, 0.08, 0.14, 'sine', 0.12);
                    break;
                case 'pageFlip':
                    this.noiseTick(0.05, 0.06);
                    break;
                case 'achievement':
                    // Three-note ascending arpeggio for milestone unlocks.
                    this.tone(523.25, 0, 0.15, 'triangle', 0.14);
                    this.tone(659.25, 0.12, 0.15, 'triangle', 0.14);
                    this.tone(783.99, 0.24, 0.25, 'triangle', 0.16);
                    break;
                default:
                    break;
            }
        } catch (e) {
            // Audio is a nice-to-have — never let it break gameplay.
            console.warn('SoundManager playback failed:', e);
        }
    }
}
