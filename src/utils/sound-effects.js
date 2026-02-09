
// 🔊 DUST DEMONS SOUND SYNTHESIZER
// Uses Web Audio API for asset-free sound effects
// Extremely lightweight and performant

let audioCtx = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const playSynthesizedSound = (type) => {
    const ctx = initAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
        case 'click':
        case 'clack':
            // Short, sharp tick
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            break;

        case 'coin':
        case 'success':
            // High ping (Coin sound)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);

            // Optional: Second harmonic for richness
            const os2 = ctx.createOscillator();
            const gn2 = ctx.createGain();
            os2.connect(gn2);
            gn2.connect(ctx.destination);
            os2.type = 'sine';
            os2.frequency.setValueAtTime(2400, now);
            gn2.gain.setValueAtTime(0.05, now);
            gn2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            os2.start(now);
            os2.stop(now + 0.5);
            break;

        case 'burn':
        case 'fire':
            // Noise burst (simulated with random modulation for now, or low osc)
            // Web Audio Noise is complex, using Low Sawtooth sweep instead
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
            osc.start(now);
            osc.stop(now + 0.8);
            break;

        case 'error':
        case 'buzzer':
            // Low descending tone
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(50, now + 0.3);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;

        case 'winner':
            // Major Arpeggio
            playNote(ctx, 523.25, now, 0.1, 'sine'); // C5
            playNote(ctx, 659.25, now + 0.1, 0.1, 'sine'); // E5
            playNote(ctx, 783.99, now + 0.2, 0.4, 'sine'); // G5
            break;

        case 'laser':
            // Sci-fi zap
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;

        default:
            break;
    }
};

const playNote = (ctx, freq, time, duration, type = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    osc.start(time);
    osc.stop(time + duration);
};
