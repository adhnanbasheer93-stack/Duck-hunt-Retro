/**
 * Procedural Retro NES Synth Engine using the Web Audio API. No external assets required.
 */

let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;

export function setMuteState(muted: boolean) {
  isMutedGlobal = muted;
}

export function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }
  
  // Create audio context
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

function getSafeCtx(): AudioContext | null {
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return isMutedGlobal ? null : audioCtx;
}

export const sfx = {
  // Gunshot - 8-Bit Noise Burst
  playGunshot: () => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      // Create Buffer for White Noise
      const bufferSize = ctx.sampleRate * 0.15; // 0.15 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Bandpass/Lowpass filter to make it sound punchy rather than hiss-like
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 3.0;

      // Punchy volume envelope
      const gainNode = ctx.createGain();
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(1.0, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      // Low bass thud sub-oscillator to give it tactile kick
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(150, now);
      subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      
      subGain.gain.setValueAtTime(0.6, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      // Connections
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      // Start and Stop
      noiseSource.start(now);
      noiseSource.stop(now + 0.15);

      subOsc.start(now);
      subOsc.stop(now + 0.15);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  },

  // Descending Square Wave Squawk for Duck Hit
  playSquawk: (baseFreq: number) => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      // Classic 8-bit vibrato-sweep
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.setValueAtTime(0.35, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      console.warn(e);
    }
  },

  // High-Pitch Star Chime / Coin Catch for Golden Duck
  playGoldenCatch: () => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now); 
      osc2.frequency.setValueAtTime(1975.53, now + 0.08); // B6

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      gain2.gain.setValueAtTime(0.15, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
      osc2.start(now);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  },

  // Short Retro Blip for Countdown Seconds
  playBlip: () => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(659.25, now); // E5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn(e);
    }
  },

  // Final count blip (different tone, higher pitch/vol)
  playFinalBlip: () => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1046.50, now); // C6 long blop

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.27);
    } catch (e) {
      console.warn(e);
    }
  },

  // Pinch notification tick (tactile feedback)
  playPinchTick: () => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn(e);
    }
  },

  // Game Start Retro Jingle
  playStartJingle: () => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, G4, C5, E5
      const noteDuration = 0.09;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * noteDuration);
        
        gain.gain.setValueAtTime(0.15, now + idx * noteDuration);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * noteDuration + noteDuration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * noteDuration);
        osc.stop(now + (idx + 1) * noteDuration + 0.02);
      });
    } catch (e) {
      console.warn(e);
    }
  },

  // Game over / Sad tune
  playGameOverSound: () => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [392.00, 369.99, 349.23, 311.13, 293.66, 261.63]; // G4, F#4, F4, D#4, D4, C4
      const durations = [0.12, 0.12, 0.12, 0.15, 0.15, 0.45];
      
      let accumTime = 0;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const duration = durations[idx];
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + accumTime);
        
        gain.gain.setValueAtTime(0.18, now + accumTime);
        gain.gain.exponentialRampToValueAtTime(0.001, now + accumTime + duration - 0.01);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + accumTime);
        osc.stop(now + accumTime + duration);
        accumTime += duration;
      });
    } catch (e) {
      console.warn(e);
    }
  },

  // Snickering dog laugh sound
  playDogLaugh: () => {
    const ctx = getSafeCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // High-pitched 8-bit rhythmic chuckle
      const laughTimes = [0.0, 0.08, 0.16, 0.24, 0.35];
      laughTimes.forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(450, now + delay);
        osc.frequency.linearRampToValueAtTime(580, now + delay + 0.04);

        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.06);
      });
    } catch (e) {
      console.warn(e);
    }
  }
};
