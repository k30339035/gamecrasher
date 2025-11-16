export class SoundSystem {
    constructor() {
        // Web Audio API 초기화
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            // AudioContext 생성
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 마스터 볼륨 컨트롤
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3; // 전체 볼륨 30%
            this.masterGain.connect(this.audioContext.destination);

            this.initialized = true;
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    // 유리 깨지는 소리
    playGlassShatter() {
        if (!this.initialized) return;

        const now = this.audioContext.currentTime;

        // 여러 주파수의 노이즈를 섞어서 유리 깨지는 소리 생성
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();

            // 높은 주파수의 노이즈
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(2000 + Math.random() * 3000, now);
            oscillator.frequency.exponentialRampToValueAtTime(500, now + 0.3);

            // 하이패스 필터로 날카로운 소리
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1500, now);
            filter.Q.value = 0.5;

            // 빠르게 페이드아웃
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(now + i * 0.02);
            oscillator.stop(now + 0.5);
        }

        // 유리 파편 떨어지는 소리 (틴클)
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const tinkle = this.audioContext.createOscillator();
                const tinkleGain = this.audioContext.createGain();

                tinkle.type = 'sine';
                tinkle.frequency.setValueAtTime(3000 + Math.random() * 2000, this.audioContext.currentTime);

                tinkleGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                tinkleGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                tinkle.connect(tinkleGain);
                tinkleGain.connect(this.masterGain);

                tinkle.start();
                tinkle.stop(this.audioContext.currentTime + 0.15);
            }, i * 50);
        }
    }

    // 콘크리트 부서지는 소리
    playConcreteCrush() {
        if (!this.initialized) return;

        const now = this.audioContext.currentTime;

        // 낮은 주파수의 럼블 소리
        const rumbleOsc = this.audioContext.createOscillator();
        const rumbleGain = this.audioContext.createGain();
        const rumbleFilter = this.audioContext.createBiquadFilter();

        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.setValueAtTime(80, now);
        rumbleOsc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.setValueAtTime(500, now);
        rumbleFilter.Q.value = 2;

        rumbleGain.gain.setValueAtTime(0.25, now);
        rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        rumbleOsc.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(this.masterGain);

        rumbleOsc.start(now);
        rumbleOsc.stop(now + 0.5);

        // 크래쉬 노이즈
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();

        noise.buffer = buffer;

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(400, now);
        noiseFilter.Q.value = 1;

        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start(now);
    }

    // 금속 부딪히는 소리
    playMetalImpact() {
        if (!this.initialized) return;

        const now = this.audioContext.currentTime;

        // 메탈릭 링 사운드
        for (let i = 0; i < 4; i++) {
            const metalOsc = this.audioContext.createOscillator();
            const metalGain = this.audioContext.createGain();
            const metalFilter = this.audioContext.createBiquadFilter();

            // 배음 시리즈
            const baseFreq = 200 + i * 150;
            metalOsc.type = 'square';
            metalOsc.frequency.setValueAtTime(baseFreq, now);
            metalOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, now + 0.5);

            metalFilter.type = 'bandpass';
            metalFilter.frequency.setValueAtTime(baseFreq * 2, now);
            metalFilter.Q.value = 10;

            metalGain.gain.setValueAtTime(0.1 / (i + 1), now);
            metalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

            metalOsc.connect(metalFilter);
            metalFilter.connect(metalGain);
            metalGain.connect(this.masterGain);

            metalOsc.start(now);
            metalOsc.stop(now + 0.7);
        }

        // 임팩트 소리
        const impactOsc = this.audioContext.createOscillator();
        const impactGain = this.audioContext.createGain();

        impactOsc.type = 'sine';
        impactOsc.frequency.setValueAtTime(150, now);
        impactOsc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

        impactGain.gain.setValueAtTime(0.3, now);
        impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        impactOsc.connect(impactGain);
        impactGain.connect(this.masterGain);

        impactOsc.start(now);
        impactOsc.stop(now + 0.15);
    }

    // 폭발 소리
    playExplosion() {
        if (!this.initialized) return;

        const now = this.audioContext.currentTime;

        // 저주파 붐
        const boom = this.audioContext.createOscillator();
        const boomGain = this.audioContext.createGain();
        const boomFilter = this.audioContext.createBiquadFilter();

        boom.type = 'sine';
        boom.frequency.setValueAtTime(60, now);
        boom.frequency.exponentialRampToValueAtTime(30, now + 0.2);

        boomFilter.type = 'lowpass';
        boomFilter.frequency.setValueAtTime(300, now);

        boomGain.gain.setValueAtTime(0.4, now);
        boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        boom.connect(boomFilter);
        boomFilter.connect(boomGain);
        boomGain.connect(this.masterGain);

        boom.start(now);
        boom.stop(now + 0.4);

        // 폭발 노이즈
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();

        noise.buffer = buffer;
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start(now);
    }

    // 레벨 클리어 소리
    playLevelComplete() {
        if (!this.initialized) return;

        const now = this.audioContext.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);

            gain.gain.setValueAtTime(0, now + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.35);
        });
    }

    // UI 클릭 소리
    playUIClick() {
        if (!this.initialized) return;

        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 배경 앰비언스 (도시 소음)
    playAmbience() {
        if (!this.initialized) return;

        // 지속적인 낮은 소음 (도시 배경음)
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.02;
        }

        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();

        noise.buffer = buffer;
        noise.loop = true;

        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        noiseFilter.Q.value = 0.5;

        noiseGain.gain.value = 0.05;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start();

        // 참조 저장 (나중에 정지할 수 있도록)
        this.ambienceSource = noise;
        this.ambienceGain = noiseGain;
    }

    stopAmbience() {
        if (this.ambienceSource) {
            this.ambienceSource.stop();
            this.ambienceSource = null;
        }
    }

    // 볼륨 조절
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    // 사운드 재생 (재질별)
    playBlockDestroy(blockType) {
        switch(blockType) {
            case 'glass':
                this.playGlassShatter();
                break;
            case 'concrete':
                this.playConcreteCrush();
                break;
            case 'steel':
            case 'window_frame':
                this.playMetalImpact();
                break;
            default:
                this.playExplosion();
        }
    }
}
