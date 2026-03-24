import * as THREE from 'three';

const COLORS = {
    bg: 0x1a1a2e,
    path: 0x4a3030,
    pathBorder: 0x8b0000,
    grid: 0x2a2a4e,
    gridValid: 0x304a30,
    gridInvalid: 0x4a3030,
    tower: 0x3a3a6e,
    towerBorder: 0xffffff,
    enemy: 0xff4444,
    enemyTank: 0xff8800,
    enemySwarm: 0xff99aa,
    projectile: 0xffff00,
    projectileLaser: 0xff00ff,
    projectileFreeze: 0x00ffff,
    core: 0x00ff00,
    coreBorder: 0xffffff,
    valid: 0x00ff00,
    invalid: 0xff0000
};

const TOWER_CONFIG = {
    laser: { cost: 50, damage: 10, range: 100, attackSpeed: 0.2, color: 0xff00ff, projectileColor: 0xff00ff, projectileSpeed: 600 },
    cannon: { cost: 100, damage: 25, range: 90, attackSpeed: 0.9, color: 0xff8800, projectileColor: 0xff8800, projectileSpeed: 350, splash: 50 },
    freeze: { cost: 75, damage: 5, range: 90, attackSpeed: 0.5, color: 0x00ffff, projectileColor: 0x00ffff, projectileSpeed: 300, slow: 0.4, slowDuration: 1.5 },
    lightning: { cost: 80, damage: 5, range: 60, attackSpeed: 0.3, color: 0xffff00, projectileColor: 0xffff00, projectileSpeed: 800, stun: 0.8, stunDuration: 1.0 },
    sniper: { cost: 150, damage: 100, range: 250, attackSpeed: 2.0, color: 0x00ff00, projectileColor: 0x00ff00, projectileSpeed: 1200 }
};

const ENEMY_CONFIG = {
    runner: { hp: 10, speed: 70, reward: 5, color: 0xff4444, size: 10 },
    tank: { hp: 50, speed: 30, reward: 12, color: 0xff8800, size: 16 },
    swarm: { hp: 3, speed: 55, reward: 2, color: 0xff99aa, size: 6 }
};

function generateWaves() {
    const waves = [];
    for (let i = 1; i <= 100; i++) {
        const wave = { enemies: [], delay: Math.max(150, 800 - i * 6) };
        
        const runnerCount = Math.floor(5 + i * 1.5);
        const tankCount = Math.floor(Math.max(0, (i - 3) * 0.8));
        const swarmCount = i > 5 ? Math.floor((i - 5) * 1.2) : 0;
        
        if (i <= 3) {
            wave.enemies.push({ type: 'runner', count: runnerCount });
        } else if (i <= 6) {
            wave.enemies.push({ type: 'runner', count: runnerCount * 0.6 });
            wave.enemies.push({ type: 'tank', count: tankCount });
        } else {
            wave.enemies.push({ type: 'runner', count: runnerCount * 0.4 });
            wave.enemies.push({ type: 'tank', count: tankCount });
            wave.enemies.push({ type: 'swarm', count: swarmCount });
        }
        
        wave.enemies = wave.enemies.map(e => ({ type: e.type, count: Math.max(1, Math.floor(e.count)) }));
        
        waves.push(wave);
    }
    return waves;
}

const WAVE_DEFINITIONS = generateWaves();

class AudioManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.musicPlaying = false;
        this.musicGain = null;
        this.sfxGain = null;
        this.songIndex = 0;
        this.sectionIndex = 0;
        this.noteTimeout = null;
        
        const n = (note, octave) => {
            const notes = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 };
            return 16.35 * Math.pow(2, (notes[note] + (octave - 1) * 12) / 12);
        };
        
        this.SONG_STRUCTURE = ['intro', 'partA', 'partA', 'intro2', 'partB', 'partC', 'partA', 'partD', 'partE', 'partF'];
        
        this.SECTIONS = {
            intro: { tempo: 120, notes: [
                { time: 0, freq: n('G', 2), dur: 0.5, vol: 0.3, type: 'sawtooth' },
                { time: 0, freq: n('E', 2), dur: 0.5, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.5, freq: n('G', 2), dur: 0.5, vol: 0.3, type: 'sawtooth' },
                { time: 0.5, freq: n('E', 2), dur: 0.5, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1, freq: n('B', 2), dur: 0.5, vol: 0.3, type: 'sawtooth' },
                { time: 1, freq: n('E', 2), dur: 0.5, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.5, freq: n('G', 2), dur: 0.5, vol: 0.3, type: 'sawtooth' },
                { time: 1.5, freq: n('E', 2), dur: 0.5, vol: 0.2, type: 'sawtooth', isBass: true },
            ]},
            intro2: { tempo: 120, notes: [
                { time: 0, freq: n('G', 2), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 0, freq: n('E', 2), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.25, freq: n('G', 2), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 0.25, freq: n('E', 2), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.5, freq: n('B', 2), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 0.5, freq: n('E', 2), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.75, freq: n('E', 2), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 0.75, freq: n('E', 2), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
            ]},
            partA: { tempo: 100, notes: [
                { time: 0, freq: n('E', 3), dur: 0.3, vol: 0.25, type: 'sawtooth' },
                { time: 0, freq: n('A', 2), dur: 0.3, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.3, freq: n('E', 3), dur: 0.3, vol: 0.25, type: 'sawtooth' },
                { time: 0.3, freq: n('A', 2), dur: 0.3, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.6, freq: n('D', 3), dur: 0.3, vol: 0.25, type: 'sawtooth' },
                { time: 0.6, freq: n('G', 2), dur: 0.3, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.9, freq: n('C', 3), dur: 0.3, vol: 0.25, type: 'sawtooth' },
                { time: 0.9, freq: n('C', 3), dur: 0.3, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.2, freq: n('B', 2), dur: 0.3, vol: 0.25, type: 'sawtooth' },
                { time: 1.2, freq: n('E', 2), dur: 0.3, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.5, freq: n('G', 2), dur: 0.5, vol: 0.25, type: 'sawtooth' },
                { time: 1.5, freq: n('E', 2), dur: 0.5, vol: 0.2, type: 'sawtooth', isBass: true },
            ]},
            partB: { tempo: 110, notes: [
                { time: 0, freq: n('A', 3), dur: 0.4, vol: 0.3, type: 'sawtooth' },
                { time: 0, freq: n('E', 2), dur: 0.4, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.4, freq: n('G', 3), dur: 0.4, vol: 0.3, type: 'sawtooth' },
                { time: 0.4, freq: n('A', 2), dur: 0.4, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.8, freq: n('B', 3), dur: 0.4, vol: 0.3, type: 'sawtooth' },
                { time: 0.8, freq: n('D', 3), dur: 0.4, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.2, freq: n('C', 4), dur: 0.4, vol: 0.3, type: 'sawtooth' },
                { time: 1.2, freq: n('E', 3), dur: 0.4, vol: 0.2, type: 'sawtooth', isBass: true },
            ]},
            partC: { tempo: 130, notes: [
                { time: 0, freq: n('E', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0, freq: n('A', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.2, freq: n('E', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0.2, freq: n('A', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.4, freq: n('G', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0.4, freq: n('G', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.6, freq: n('A', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0.6, freq: n('A', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.8, freq: n('B', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0.8, freq: n('D', 3), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1, freq: n('D', 4), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 1, freq: n('E', 3), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.2, freq: n('E', 4), dur: 0.3, vol: 0.3, type: 'sawtooth' },
                { time: 1.2, freq: n('A', 2), dur: 0.3, vol: 0.2, type: 'sawtooth', isBass: true },
            ]},
            partD: { tempo: 140, notes: [
                { time: 0, freq: n('D', 4), dur: 0.15, vol: 0.35, type: 'sawtooth' },
                { time: 0, freq: n('A', 2), dur: 0.15, vol: 0.25, type: 'sawtooth', isBass: true },
                { time: 0.15, freq: n('E', 4), dur: 0.15, vol: 0.35, type: 'sawtooth' },
                { time: 0.15, freq: n('A', 2), dur: 0.15, vol: 0.25, type: 'sawtooth', isBass: true },
                { time: 0.3, freq: n('G', 4), dur: 0.15, vol: 0.35, type: 'sawtooth' },
                { time: 0.3, freq: n('G', 2), dur: 0.15, vol: 0.25, type: 'sawtooth', isBass: true },
                { time: 0.45, freq: n('E', 4), dur: 0.15, vol: 0.35, type: 'sawtooth' },
                { time: 0.45, freq: n('A', 2), dur: 0.15, vol: 0.25, type: 'sawtooth', isBass: true },
                { time: 0.6, freq: n('A', 4), dur: 0.15, vol: 0.35, type: 'sawtooth' },
                { time: 0.6, freq: n('E', 2), dur: 0.15, vol: 0.25, type: 'sawtooth', isBass: true },
                { time: 0.75, freq: n('G', 4), dur: 0.15, vol: 0.35, type: 'sawtooth' },
                { time: 0.75, freq: n('G', 2), dur: 0.15, vol: 0.25, type: 'sawtooth', isBass: true },
                { time: 0.9, freq: n('B', 4), dur: 0.15, vol: 0.35, type: 'sawtooth' },
                { time: 0.9, freq: n('D', 3), dur: 0.15, vol: 0.25, type: 'sawtooth', isBass: true },
                { time: 1.05, freq: n('C', 5), dur: 0.3, vol: 0.35, type: 'sawtooth' },
                { time: 1.05, freq: n('E', 3), dur: 0.3, vol: 0.25, type: 'sawtooth', isBass: true },
            ]},
            partE: { tempo: 115, notes: [
                { time: 0, freq: n('G', 3), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 0, freq: n('D', 3), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.25, freq: n('B', 3), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 0.25, freq: n('D', 3), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.5, freq: n('C', 4), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 0.5, freq: n('G', 3), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.75, freq: n('A', 3), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 0.75, freq: n('E', 3), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1, freq: n('G', 3), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 1, freq: n('A', 2), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.25, freq: n('B', 3), dur: 0.25, vol: 0.3, type: 'sawtooth' },
                { time: 1.25, freq: n('A', 2), dur: 0.25, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.5, freq: n('D', 4), dur: 0.5, vol: 0.3, type: 'sawtooth' },
                { time: 1.5, freq: n('E', 2), dur: 0.5, vol: 0.2, type: 'sawtooth', isBass: true },
            ]},
            partF: { tempo: 125, notes: [
                { time: 0, freq: n('E', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0, freq: n('E', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.2, freq: n('E', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0.2, freq: n('E', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.4, freq: n('G', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0.4, freq: n('E', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.6, freq: n('G', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0.6, freq: n('E', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 0.8, freq: n('A', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 0.8, freq: n('A', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1, freq: n('A', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 1, freq: n('A', 2), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.2, freq: n('B', 3), dur: 0.2, vol: 0.3, type: 'sawtooth' },
                { time: 1.2, freq: n('D', 3), dur: 0.2, vol: 0.2, type: 'sawtooth', isBass: true },
                { time: 1.4, freq: n('C', 4), dur: 0.4, vol: 0.3, type: 'sawtooth' },
                { time: 1.4, freq: n('E', 3), dur: 0.4, vol: 0.2, type: 'sawtooth', isBass: true },
            ]},
        };
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
        
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.3;
        this.sfxGain.connect(this.ctx.destination);
        
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.12;
        this.musicGain.connect(this.ctx.destination);
    }

    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;
        this.sectionIndex = 0;
        this.playSection();
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.noteTimeout) clearTimeout(this.noteTimeout);
    }

    playSection() {
        if (!this.musicPlaying || !this.ctx) return;
        
        const sectionName = this.SONG_STRUCTURE[this.sectionIndex];
        const section = this.SECTIONS[sectionName];
        const sectionDuration = 2.0;
        
        section.notes.forEach(note => {
            const startTime = this.ctx.currentTime + note.time;
            
            const osc = this.ctx.createOscillator();
            osc.type = note.type;
            osc.frequency.value = note.freq;
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(note.vol, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(startTime);
            osc.stop(startTime + note.dur);
        });
        
        this.sectionIndex = (this.sectionIndex + 1) % this.SONG_STRUCTURE.length;
        this.noteTimeout = setTimeout(() => this.playSection(), sectionDuration * 1000);
    }

    playShoot(type) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        if (type === 'laser') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } else if (type === 'cannon') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } else if (type === 'freeze') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } else if (type === 'lightning') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.06);
        } else if (type === 'sniper') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        }
    }

    playEnemyDeath() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playTowerDamage() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playWaveStart() {
        if (!this.ctx) return;
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.frequency.setValueAtTime(220, this.ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.15 + 0.12);
            osc.start(this.ctx.currentTime + i * 0.15);
            osc.stop(this.ctx.currentTime + i * 0.15 + 0.12);
        }
    }

    playPlace() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.setValueAtTime(500, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.audio = new AudioManager();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.bg);

        this.camera = new THREE.OrthographicCamera(-400, 400, -225, 225, 0.1, 1000);
        this.camera.position.z = 100;
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
        this.renderer.setPixelRatio(1);

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.gridCells = [];
        this.pathCells = new Set();
        this.particles = [];

        this.gold = 150;
        this.towerHP = 100;
        this.maxTowerHP = 100;
        this.kills = 0;
        this.currentWave = 0;
        this.waveInProgress = false;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        this.selectedTower = null;
        this.hoveredCell = null;
        this.gameOver = false;
        this.victory = false;
        this.gameStarted = false;
        this.screenShake = 0;

        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        this.setupScene();
        this.setupGrid();
        this.setupPath();
        this.setupEventListeners();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    createPixelRect(width, height, color, borderColor) {
        const group = new THREE.Group();
        
        const bodyGeo = new THREE.BoxGeometry(width, height, 8);
        const bodyMat = new THREE.MeshBasicMaterial({ color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        const edges = new THREE.EdgesGeometry(bodyGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: borderColor });
        const lines = new THREE.LineSegments(edges, lineMat);
        group.add(lines);

        return group;
    }

    setupScene() {
        const gridGeo = new THREE.PlaneGeometry(800, 450);
        const gridMat = new THREE.MeshBasicMaterial({ color: COLORS.grid });
        const gridPlane = new THREE.Mesh(gridGeo, gridMat);
        gridPlane.position.z = -2;
        this.scene.add(gridPlane);

        this.towerCore = this.createPixelTower();
        this.towerCore.position.set(270, 0, 0);
        this.scene.add(this.towerCore);

        this.pathMeshes = this.createPathVisualization();
        this.pathMeshes.forEach(m => this.scene.add(m));

        this.validHoverMesh = this.createHoverCell(COLORS.valid);
        this.invalidHoverMesh = this.createHoverCell(COLORS.invalid);
        this.validHoverMesh.visible = false;
        this.invalidHoverMesh.visible = false;
        this.scene.add(this.validHoverMesh);
        this.scene.add(this.invalidHoverMesh);

        this.rangeIndicator = this.createRangeIndicator();
        this.rangeIndicator.visible = false;
        this.scene.add(this.rangeIndicator);
    }

    createPixelTower() {
        const group = new THREE.Group();

        const baseGeo = new THREE.CylinderGeometry(28, 32, 10, 12);
        const baseMat = new THREE.MeshBasicMaterial({ color: 0x2a2a4e });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.rotation.x = Math.PI / 2;
        group.add(base);

        const baseRing = new THREE.TorusGeometry(30, 3, 8, 12);
        const baseRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const ring = new THREE.Mesh(baseRing, baseRingMat);
        ring.position.z = 5;
        group.add(ring);

        const coreGeo = new THREE.CylinderGeometry(18, 18, 16, 12);
        const coreMat = new THREE.MeshBasicMaterial({ color: COLORS.core });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.rotation.x = Math.PI / 2;
        core.position.z = 10;
        group.add(core);
        this.towerCoreMesh = core;

        const topGeo = new THREE.CylinderGeometry(12, 12, 10, 8);
        const topMat = new THREE.MeshBasicMaterial({ color: 0x00cc00 });
        const top = new THREE.Mesh(topGeo, topMat);
        top.rotation.x = Math.PI / 2;
        top.position.z = 20;
        group.add(top);

        return group;
    }

    createPathVisualization() {
        const meshes = [];
        const pathPoints = this.getPathPoints();

        for (let i = 0; i < pathPoints.length - 1; i++) {
            const start = pathPoints[i];
            const end = pathPoints[i + 1];

            if (start.x === end.x) {
                const cellX = Math.round(start.x / 30) * 30;
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                const startCellY = Math.round(minY / 30) * 30;
                const endCellY = Math.round(maxY / 30) * 30;
                for (let cellY = startCellY; cellY <= endCellY; cellY += 30) {
                    const cell = this.createPixelRect(28, 28, COLORS.path, COLORS.pathBorder);
                    cell.position.set(cellX, cellY, -1);
                    meshes.push(cell);
                }
            } else {
                const cellY = Math.round(start.y / 30) * 30;
                const minX = Math.min(start.x, end.x);
                const maxX = Math.max(start.x, end.x);
                const startCellX = Math.round(minX / 30) * 30;
                const endCellX = Math.round(maxX / 30) * 30;
                for (let cellX = startCellX; cellX <= endCellX; cellX += 30) {
                    const cell = this.createPixelRect(28, 28, COLORS.path, COLORS.pathBorder);
                    cell.position.set(cellX, cellY, -1);
                    meshes.push(cell);
                }
            }
        }

        return meshes;
    }

    createHoverCell(color) {
        const group = new THREE.Group();
        
        const geo = new THREE.CylinderGeometry(16, 16, 2, 12);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
        const cell = new THREE.Mesh(geo, mat);
        cell.rotation.x = Math.PI / 2;
        group.add(cell);
        
        return group;
    }

    createRangeIndicator() {
        const group = new THREE.Group();
        const geo = new THREE.RingGeometry(0.85, 1, 4);
        const mat = new THREE.MeshBasicMaterial({ 
            color: COLORS.valid, 
            transparent: true, 
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);
        
        const borderGeo = new THREE.EdgesGeometry(new THREE.RingGeometry(0.85, 1, 4));
        const borderMat = new THREE.LineBasicMaterial({ color: COLORS.valid });
        const border = new THREE.LineSegments(borderGeo, borderMat);
        border.rotation.x = -Math.PI / 2;
        group.add(border);

        return group;
    }

    getPathPoints() {
        return [
            new THREE.Vector3(-420, 0, 0),
            new THREE.Vector3(-210, 0, 0),
            new THREE.Vector3(-210, 150, 0),
            new THREE.Vector3(90, 150, 0),
            new THREE.Vector3(90, -120, 0),
            new THREE.Vector3(270, -120, 0),
            new THREE.Vector3(270, 0, 0),
            new THREE.Vector3(450, 0, 0)
        ];
    }

    setupPath() {
        const pathPoints = this.getPathPoints();
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const start = pathPoints[i];
            const end = pathPoints[i + 1];
            
            if (start.x === end.x) {
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                const cellX = Math.round(start.x / 30) * 30;
                const startCellY = Math.round(minY / 30) * 30;
                const endCellY = Math.round(maxY / 30) * 30;
                for (let cellY = startCellY; cellY <= endCellY; cellY += 30) {
                    this.pathCells.add(`${cellX},${cellY}`);
                }
            } else {
                const minX = Math.min(start.x, end.x);
                const maxX = Math.max(start.x, end.x);
                const cellY = Math.round(start.y / 30) * 30;
                const startCellX = Math.round(minX / 30) * 30;
                const endCellX = Math.round(maxX / 30) * 30;
                for (let cellX = startCellX; cellX <= endCellX; cellX += 30) {
                    this.pathCells.add(`${cellX},${cellY}`);
                }
            }
        }
    }

    setupGrid() {
        for (let x = -390; x <= 390; x += 30) {
            for (let y = -210; y <= 210; y += 30) {
                this.gridCells.push({ x, y, occupied: false });
            }
        }
    }

    setupEventListeners() {
        const towerCards = document.querySelectorAll('.tower-card');
        towerCards.forEach(card => {
            card.addEventListener('click', () => this.selectTower(card.dataset.type));
        });

        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelPlacement();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.cancelPlacement();
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            this.audio.init();
            this.audio.startMusic();
            document.getElementById('start-overlay').classList.add('hidden');
            this.gameStarted = true;
            this.startWave();
        });

        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }

    selectTower(type) {
        const config = TOWER_CONFIG[type];
        if (this.gold < config.cost) {
            this.showTooltip('NO GOLD!');
            return;
        }

        this.selectedTower = type;
        document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
        this.audio.init();
    }

    cancelPlacement() {
        this.selectedTower = null;
        document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
        this.rangeIndicator.visible = false;
        this.validHoverMesh.visible = false;
        this.invalidHoverMesh.visible = false;
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const worldX = x * this.camera.right;
        const worldY = y * this.camera.top;

        const cellX = Math.round(worldX / 30) * 30;
        const cellY = Math.round(worldY / 30) * 30;

        this.hoveredCell = { x: cellX, y: cellY };

        this.validHoverMesh.visible = false;
        this.invalidHoverMesh.visible = false;

        if (this.selectedTower && this.gameStarted && !this.gameOver) {
            const config = TOWER_CONFIG[this.selectedTower];
            this.rangeIndicator.visible = true;
            this.rangeIndicator.position.set(cellX, cellY, 0.1);
            this.rangeIndicator.scale.setScalar(config.range / 10);

            const isOnPath = this.pathCells.has(`${cellX},${cellY}`);
            const isOnTower = Math.abs(cellX - 270) < 40 && Math.abs(cellY) < 40;
            const isOccupied = this.towers.some(t => t.gridX === cellX && t.gridY === cellY);
            const canAfford = this.gold >= config.cost;

            const isValid = !isOnPath && !isOnTower && !isOccupied && canAfford;

            if (isValid) {
                this.validHoverMesh.position.set(cellX, cellY, 1);
                this.validHoverMesh.visible = true;
            } else {
                this.invalidHoverMesh.position.set(cellX, cellY, 1);
                this.invalidHoverMesh.visible = true;
            }
        } else {
            this.rangeIndicator.visible = false;
        }
    }

    onClick(e) {
        if (!this.selectedTower || !this.gameStarted || this.gameOver) return;

        const cell = this.hoveredCell;
        if (!cell) return;

        const isOnPath = this.pathCells.has(`${cell.x},${cell.y}`);
        const isOnTower = Math.abs(cell.x - 270) < 40 && Math.abs(cell.y) < 40;
        const isOccupied = this.towers.some(t => t.gridX === cell.x && t.gridY === cell.y);

        if (isOnPath || isOnTower || isOccupied) {
            this.showTooltip('CANT PLACE!');
            return;
        }

        const config = TOWER_CONFIG[this.selectedTower];
        if (this.gold < config.cost) {
            this.showTooltip('NO GOLD!');
            return;
        }

        this.placeTower(cell.x, cell.y, this.selectedTower);
    }

    placeTower(x, y, type) {
        const config = TOWER_CONFIG[type];
        this.gold -= config.cost;
        this.updateUI();

        const towerMesh = this.createTowerMesh(type);
        towerMesh.position.set(x, y, 2);
        this.scene.add(towerMesh);

        this.towers.push({
            mesh: towerMesh,
            type,
            gridX: x,
            gridY: y,
            damage: config.damage,
            range: config.range,
            attackSpeed: config.attackSpeed,
            cooldown: 0,
            ...config
        });

        const cell = this.gridCells.find(c => c.x === x && c.y === y);
        if (cell) cell.occupied = true;

        this.audio.playPlace();
        this.spawnParticles(x, y, config.color, 6);
        this.cancelPlacement();
    }

    createTowerMesh(type) {
        const config = TOWER_CONFIG[type];
        const group = new THREE.Group();

        const baseGeo = new THREE.CylinderGeometry(14, 16, 8, 8);
        const baseMat = new THREE.MeshBasicMaterial({ color: 0x3a3a5e });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.rotation.x = Math.PI / 2;
        group.add(base);

        const baseRing = new THREE.TorusGeometry(15, 2, 6, 8);
        const baseRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const ring = new THREE.Mesh(baseRing, baseRingMat);
        ring.position.z = 4;
        group.add(ring);

        let turret;
        if (type === 'laser') {
            const turretGeo = new THREE.CylinderGeometry(6, 8, 12, 6);
            const turretMat = new THREE.MeshBasicMaterial({ color: config.color });
            turret = new THREE.Mesh(turretGeo, turretMat);
        } else if (type === 'cannon') {
            const turretGeo = new THREE.CylinderGeometry(5, 9, 16, 8);
            const turretMat = new THREE.MeshBasicMaterial({ color: config.color });
            turret = new THREE.Mesh(turretGeo, turretMat);
        } else if (type === 'lightning') {
            const turretGeo = new THREE.CylinderGeometry(7, 7, 10, 6);
            const turretMat = new THREE.MeshBasicMaterial({ color: config.color });
            turret = new THREE.Mesh(turretGeo, turretMat);
        } else if (type === 'sniper') {
            const turretGeo = new THREE.CylinderGeometry(4, 5, 20, 6);
            const turretMat = new THREE.MeshBasicMaterial({ color: config.color });
            turret = new THREE.Mesh(turretGeo, turretMat);
        } else {
            const turretGeo = new THREE.CylinderGeometry(6, 7, 10, 6);
            const turretMat = new THREE.MeshBasicMaterial({ color: config.color });
            turret = new THREE.Mesh(turretGeo, turretMat);
        }

        turret.rotation.x = Math.PI / 2;
        turret.position.z = 8;
        group.add(turret);
        group.turret = turret;

        return group;
    }

    spawnEnemy(type) {
        const config = ENEMY_CONFIG[type];
        const mesh = this.createPixelRect(config.size, config.size, config.color, 0xffffff);
        
        const pathPoints = this.getPathPoints();
        mesh.position.copy(pathPoints[0]);
        mesh.position.z = 2;

        this.scene.add(mesh);

        const enemy = {
            mesh,
            type,
            hp: config.hp,
            maxHP: config.hp,
            speed: config.speed,
            reward: config.reward,
            pathIndex: 0,
            progress: 0,
            slowed: false,
            slowTimer: 0,
            slowFactor: 1,
            stunned: false,
            stunTimer: 0,
            wobble: Math.random() * Math.PI * 2
        };

        this.enemies.push(enemy);
    }

    startWave() {
        if (this.currentWave >= WAVE_DEFINITIONS.length) {
            this.victory = true;
            this.endGame(true);
            return;
        }

        this.waveInProgress = true;
        const waveDef = WAVE_DEFINITIONS[this.currentWave];
        
        this.enemiesToSpawn = [];
        waveDef.enemies.forEach(e => {
            for (let i = 0; i < e.count; i++) {
                this.enemiesToSpawn.push(e.type);
            }
        });

        this.spawnTimer = 0;
        this.showWaveAnnouncement(`WAVE ${this.currentWave + 1}`);
        this.audio.playWaveStart();
    }

    showWaveAnnouncement(text) {
        const el = document.getElementById('wave-announcement');
        el.textContent = text;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 1500);
    }

    showTooltip(text) {
        const el = document.getElementById('tooltip');
        el.textContent = text;
        el.style.left = '50%';
        el.style.top = '35%';
        el.style.transform = 'translate(-50%, -50%)';
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 800);
    }

    updateEnemies(delta) {
        const pathPoints = this.getPathPoints();

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            enemy.wobble += delta * 8;

            if (enemy.stunned) {
                enemy.stunTimer -= delta;
                enemy.mesh.rotation.z = Math.sin(enemy.wobble * 10) * 0.5;
                if (enemy.stunTimer <= 0) {
                    enemy.stunned = false;
                }
                continue;
            }

            enemy.mesh.rotation.z = Math.sin(enemy.wobble) * 0.2;

            if (enemy.slowed) {
                enemy.slowTimer -= delta;
                if (enemy.slowTimer <= 0) {
                    enemy.slowed = false;
                    enemy.slowFactor = 1;
                }
            }

            const speed = enemy.speed * enemy.slowFactor * delta;
            enemy.progress += speed;

            const currentPoint = pathPoints[enemy.pathIndex];
            const nextPoint = pathPoints[enemy.pathIndex + 1];

            if (!nextPoint) {
                this.damageTower();
                this.removeEnemy(i);
                continue;
            }

            const segmentLength = currentPoint.distanceTo(nextPoint);

            if (enemy.progress >= segmentLength) {
                enemy.progress -= segmentLength;
                enemy.pathIndex++;
                if (enemy.pathIndex >= pathPoints.length - 1) {
                    this.damageTower();
                    this.removeEnemy(i);
                    continue;
                }
            }

            const t = enemy.progress / segmentLength;
            const pos = new THREE.Vector3().lerpVectors(currentPoint, nextPoint, t);
            enemy.mesh.position.copy(pos);
        }
    }

    updateTowers(delta) {
        this.towers.forEach(tower => {
            tower.mesh.turret.rotation.z += delta * 2;

            let closestEnemy = null;
            let closestDist = tower.range;

            this.enemies.forEach(enemy => {
                const dist = tower.mesh.position.distanceTo(enemy.mesh.position);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = enemy;
                }
            });

            if (closestEnemy) {
                const dir = new THREE.Vector3().subVectors(closestEnemy.mesh.position, tower.mesh.position);
                tower.angle = Math.atan2(dir.y, dir.x);
                tower.mesh.turret.rotation.z = tower.angle + Math.PI / 2;

                tower.cooldown -= delta;
                if (tower.cooldown <= 0) {
                    tower.cooldown = tower.attackSpeed;
                    this.fireProjectile(tower, closestEnemy);
                }
            }
        });
    }

    fireProjectile(tower, target) {
        const geo = new THREE.BoxGeometry(6, 6, 4);
        const mat = new THREE.MeshBasicMaterial({ color: tower.projectileColor });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(tower.mesh.position);
        mesh.position.z = 3;
        this.scene.add(mesh);

        this.projectiles.push({
            mesh,
            target,
            tower,
            speed: tower.projectileSpeed,
            damage: tower.damage,
            splash: tower.splash || 0,
            slow: tower.slow || 0,
            slowDuration: tower.slowDuration || 0,
            stun: tower.stun || 0,
            stunDuration: tower.stunDuration || 0
        });

        this.audio.playShoot(tower.type);
    }

    updateProjectiles(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            if (!proj.target || proj.target.hp <= 0) {
                this.scene.remove(proj.mesh);
                proj.mesh.geometry.dispose();
                proj.mesh.material.dispose();
                this.projectiles.splice(i, 1);
                continue;
            }

            const dir = new THREE.Vector3().subVectors(proj.target.mesh.position, proj.mesh.position);
            const dist = dir.length();

            if (dist < 12) {
                this.hitEnemy(proj.target, proj);
                this.scene.remove(proj.mesh);
                proj.mesh.geometry.dispose();
                proj.mesh.material.dispose();
                this.projectiles.splice(i, 1);
                continue;
            }

            dir.normalize();
            proj.mesh.position.add(dir.multiplyScalar(proj.speed * delta));
            proj.mesh.rotation.z += delta * 10;
        }
    }

    hitEnemy(enemy, proj) {
        enemy.hp -= proj.damage;

        if (proj.slow > 0) {
            enemy.slowed = true;
            enemy.slowFactor = proj.slow;
            enemy.slowTimer = proj.slowDuration;
        }

        if (proj.stun > 0) {
            enemy.stunned = true;
            enemy.stunTimer = proj.stunDuration;
        }

        if (proj.splash > 0) {
            this.enemies.forEach(e => {
                if (e !== enemy) {
                    const dist = enemy.mesh.position.distanceTo(e.mesh.position);
                    if (dist < proj.splash) {
                        e.hp -= proj.damage * 0.5;
                    }
                }
            });
            this.spawnParticles(enemy.mesh.position.x, enemy.mesh.position.y, 0xff8800, 10);
        }

        this.spawnParticles(enemy.mesh.position.x, enemy.mesh.position.y, proj.tower.color, 4);

        if (enemy.hp <= 0) {
            const idx = this.enemies.indexOf(enemy);
            if (idx !== -1) {
                this.gold += enemy.reward;
                this.kills++;
                this.updateUI();
                this.audio.playEnemyDeath();
                this.spawnParticles(enemy.mesh.position.x, enemy.mesh.position.y, ENEMY_CONFIG[enemy.type].color, 8);
                this.removeEnemy(idx);
            }
        }
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const size = 4 + Math.random() * 4;
            const geo = new THREE.BoxGeometry(size, size, 4);
            const mat = new THREE.MeshBasicMaterial({ color });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, 3);
            this.scene.add(mesh);

            this.particles.push({
                mesh,
                velocity: {
                    x: (Math.random() - 0.5) * 150,
                    y: (Math.random() - 0.5) * 150
                },
                life: 0.5 + Math.random() * 0.3
            });
        }
    }

    removeEnemy(index) {
        const enemy = this.enemies[index];
        this.scene.remove(enemy.mesh);
        enemy.mesh.children.forEach(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
        });
        this.enemies.splice(index, 1);
    }

    damageTower() {
        this.towerHP -= 10;
        this.screenShake = 0.25;
        this.audio.playTowerDamage();

        this.towerCoreMesh.children[0].material.color.setHex(0xff0000);
        setTimeout(() => {
            if (this.towerCoreMesh) {
                this.towerCoreMesh.children[0].material.color.setHex(COLORS.core);
            }
        }, 150);

        this.spawnParticles(this.towerCore.position.x, this.towerCore.position.y, 0xff0000, 15);
        this.updateUI();

        if (this.towerHP <= 0) {
            this.gameOver = true;
            this.endGame(false);
        }
    }

    updateUI() {
        document.getElementById('gold-display').textContent = this.gold;
        document.getElementById('kills-display').textContent = this.kills;
        document.getElementById('wave-display').textContent = `${this.currentWave + 1}/100`;
        document.getElementById('tower-hp-fill').style.width = `${(this.towerHP / this.maxTowerHP) * 100}%`;

        document.querySelectorAll('.tower-card').forEach(card => {
            const type = card.dataset.type;
            const cost = TOWER_CONFIG[type].cost;
            if (this.gold < cost) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    }

    endGame(victory) {
        this.audio.stopMusic();
        
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        const subtitle = document.getElementById('overlay-subtitle');

        if (victory) {
            title.textContent = 'VICTORY!';
            title.className = 'victory';
            subtitle.textContent = `Kills: ${this.kills} | Gold: ${this.gold}`;
        } else {
            title.textContent = 'GAME OVER';
            title.className = 'defeat';
            subtitle.textContent = `Waves: ${this.currentWave} | Kills: ${this.kills}`;
        }

        overlay.classList.add('active');
    }

    restart() {
        this.towers.forEach(t => {
            this.scene.remove(t.mesh);
            t.mesh.children.forEach(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        });
        this.towers = [];

        this.enemies.forEach(e => {
            this.scene.remove(e.mesh);
            e.mesh.children.forEach(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        });
        this.enemies = [];

        this.projectiles.forEach(p => {
            this.scene.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            if (p.mesh.material) p.mesh.material.dispose();
        });
        this.projectiles = [];

        this.particles.forEach(p => {
            this.scene.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            if (p.mesh.material) p.mesh.material.dispose();
        });
        this.particles = [];

        this.gridCells.forEach(cell => cell.occupied = false);

        this.gold = 150;
        this.towerHP = 100;
        this.kills = 0;
        this.currentWave = 0;
        this.waveInProgress = false;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        this.selectedTower = null;
        this.gameOver = false;
        this.victory = false;
        this.screenShake = 0;

        this.audio.stopMusic();
        this.audio.startMusic();

        this.validHoverMesh.visible = false;
        this.invalidHoverMesh.visible = false;
        this.rangeIndicator.visible = false;

        document.getElementById('game-overlay').classList.remove('active');
        this.updateUI();
        this.startWave();
    }

    resize() {
        const container = document.getElementById('game-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        const aspect = width / height;
        
        if (aspect > 16 / 9) {
            this.camera.left = -400;
            this.camera.right = 400;
            this.camera.top = 225;
            this.camera.bottom = -225;
        } else {
            this.camera.top = 225;
            this.camera.bottom = -225;
            this.camera.left = -225 * aspect;
            this.camera.right = 225 * aspect;
        }
        
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (this.gameStarted && !this.gameOver) {
            if (this.waveInProgress && this.enemiesToSpawn.length > 0) {
                this.spawnTimer += delta * 1000;
                const waveDef = WAVE_DEFINITIONS[this.currentWave];
                
                if (this.spawnTimer >= waveDef.delay) {
                    this.spawnTimer = 0;
                    const type = this.enemiesToSpawn.shift();
                    this.spawnEnemy(type);
                }
            }

            if (this.waveInProgress && this.enemiesToSpawn.length === 0 && this.enemies.length === 0) {
                this.waveInProgress = false;
                this.gold += 25 + (this.currentWave + 1) * 5;
                this.currentWave++;
                this.updateUI();

                if (this.currentWave >= WAVE_DEFINITIONS.length) {
                    this.victory = true;
                    this.endGame(true);
                } else {
                    setTimeout(() => this.startWave(), 2500);
                }
            }

            this.updateEnemies(delta);
            this.updateTowers(delta);
            this.updateProjectiles(delta);
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.x += p.velocity.x * delta;
            p.mesh.position.y += p.velocity.y * delta;
            p.velocity.x *= 0.95;
            p.velocity.y *= 0.95;
            p.life -= delta * 2;
            p.mesh.scale.setScalar(Math.max(0, p.life));

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                if (p.mesh.geometry) p.mesh.geometry.dispose();
                if (p.mesh.material) p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }

        if (this.screenShake > 0) {
            this.camera.position.x = (Math.random() - 0.5) * this.screenShake * 15;
            this.camera.position.y = (Math.random() - 0.5) * this.screenShake * 15;
            this.screenShake -= delta * 3;
        } else {
            this.camera.position.x = 0;
            this.camera.position.y = 0;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
