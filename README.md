# ATTAK - Tower Assault Game

A browser-based tower defense game built with Three.js. Defend your tower against 100 waves of enemies by strategically placing defensive towers.

## Quick Start

```bash
# Serve locally
cd /localfolder/tower
python3 -m http.server 3000

# Access at http://localhost:3000 or http://<your-ip>:3000
```

## How to Play

1. Click **Start Game** on the title screen
2. Select a tower from the **bottom panel**
3. Click on the **green grid cells** to place towers
4. Towers **automatically attack** enemies in range
5. **Earn gold** by killing enemies
6. **Survive all 100 waves** to win

### Controls
- **Left Click** - Select tower / Place tower
- **Right Click** or **ESC** - Cancel tower placement

---

## Game Elements

### Towers

| Tower | Cost | Damage | Range | Attack Speed | Special |
|-------|------|--------|-------|--------------|---------|
| **Laser** | 50g | 10 | 100px | Fast (0.2s) | Single target |
| **Cannon** | 100g | 25 | 90px | Slow (0.9s) | Splash damage (50px) |
| **Freeze** | 75g | 5 | 90px | Medium (0.5s) | Slows 40% for 1.5s |
| **Lightning** | 80g | 5 | 60px | Medium (0.3s) | Stuns for 1.0s |
| **Sniper** | 150g | 100 | 250px | Very slow (2.0s) | Long range assassin |

### Enemies

| Enemy | HP | Speed | Reward | Size |
|-------|-----|-------|--------|------|
| **Runner** | 10 | 70 | 5g | Small |
| **Tank** | 50 | 30 | 12g | Large |
| **Swarm** | 3 | 55 | 2g | Tiny |

### Waves
- **100 total waves** with scaling difficulty
- **Waves 1-3**: Runners only
- **Waves 4-6**: Runners + Tanks
- **Waves 7+**: All enemy types
- Enemy counts increase each wave
- Spawn delays decrease over time

### Economy
- **Starting gold**: 150
- **Kill rewards**: Runner 5g, Tank 12g, Swarm 2g
- **Wave bonus**: 25 + (wave_number × 5) gold

---

## File Structure

```
/mnt/extbod/localwork/tower/
├── index.html      # Main HTML with UI elements and styles
├── game.js         # Core game logic (all classes and systems)
├── SPEC.md         # Original design specification
└── README.md       # This file
```

---

## Architecture

### Core Classes

#### `AudioManager`
Manages all sound effects and background music.

**Location**: `game.js` lines 67-340

**Key Methods**:
- `init()` - Initialize Web Audio context
- `startMusic()` - Begin background music loop
- `stopMusic()` - Stop background music
- `playShoot(type)` - Play tower attack sound
- `playEnemyDeath()` - Play enemy death sound
- `playTowerDamage()` - Play tower hit sound
- `playWaveStart()` - Play wave announcement sound
- `playPlace()` - Play tower placement sound

**Adding New Sound Effects**:
```javascript
playNewSound() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(this.sfxGain);
    // Configure frequency, gain envelope
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
}
```

#### `Game`
Main game class managing all game state and systems.

**Location**: `game.js` lines 240-1200+

**Key Properties**:
- `towers[]` - Array of placed towers
- `enemies[]` - Array of active enemies
- `projectiles[]` - Array of active projectiles
- `particles[]` - Array of particle effects
- `gridCells[]` - Valid tower placement positions
- `pathCells` - Set of cells containing enemy path

**Key Methods**:
- `init()` - Initialize game systems
- `setupScene()` - Create Three.js scene
- `setupGrid()` - Initialize placement grid
- `setupPath()` - Define enemy path
- `setupEventListeners()` - Set up input handlers
- `animate()` - Main game loop
- `updateEnemies(delta)` - Update enemy positions and states
- `updateTowers(delta)` - Update tower targeting and attacks
- `updateProjectiles(delta)` - Update projectile positions
- `spawnEnemy(type)` - Spawn a new enemy
- `startWave()` - Begin next wave
- `placeTower(x, y, type)` - Place a tower
- `fireProjectile(tower, target)` - Fire tower projectile
- `hitEnemy(enemy, proj)` - Handle enemy damage
- `damageTower()` - Handle tower taking damage
- `endGame(victory)` - End game state
- `restart()` - Reset and restart game
- `resize()` - Handle window resize

### Configuration Constants

**Location**: `game.js` lines 1-65

#### Tower Configuration
```javascript
const TOWER_CONFIG = {
    towerName: { 
        cost: Number,           // Gold cost
        damage: Number,          // Damage per hit
        range: Number,          // Attack range in pixels
        attackSpeed: Number,    // Seconds between attacks
        color: HexColor,        // Tower color
        projectileColor: HexColor, // Projectile color
        projectileSpeed: Number, // Projectile travel speed
        splash: Number,         // Splash radius (0 if none)
        slow: Number,           // Slow factor (0 if none)
        slowDuration: Number,   // Slow duration (0 if none)
        stun: Number,           // Stun factor (0 if none)
        stunDuration: Number    // Stun duration (0 if none)
    }
};
```

#### Enemy Configuration
```javascript
const ENEMY_CONFIG = {
    enemyType: {
        hp: Number,            // Health points
        speed: Number,          // Movement speed
        reward: Number,         // Gold on kill
        color: HexColor,        // Enemy color
        size: Number            // Visual size
    }
};
```

#### Wave Generation
Waves are auto-generated by `generateWaves()` function (lines 38-63).

**To modify wave generation**:
```javascript
function generateWaves() {
    const waves = [];
    for (let i = 1; i <= 100; i++) {
        const wave = { 
            enemies: [], 
            delay: Math.max(MIN_DELAY, BASE_DELAY - i * SCALING) 
        };
        
        // Customize enemy composition
        wave.enemies.push({ type: 'runner', count: count });
        
        waves.push(wave);
    }
    return waves;
}
```

### Music System

**Location**: `game.js` lines 67-280

The music system uses a section-based approach:

```javascript
this.SONG_STRUCTURE = ['intro', 'partA', 'partA', 'intro2', ...];

this.SECTIONS = {
    sectionName: {
        tempo: Number,  // BPM
        notes: [
            { 
                time: Number,   // Beat position
                freq: Number,    // Frequency in Hz
                dur: Number,     // Duration in seconds
                vol: Number,     // Volume (0-1)
                type: String,    // Oscillator type
                isBass: Boolean  // Is bass track
            }
        ]
    }
};
```

**To add a new song section**:
```javascript
partX: { 
    tempo: 120, 
    notes: [
        { time: 0, freq: 110, dur: 0.5, vol: 0.3, type: 'sawtooth' },
        { time: 0.5, freq: 220, dur: 0.5, vol: 0.3, type: 'sawtooth' },
        // ... more notes
    ]
}
```

Then add to `SONG_STRUCTURE` array.

---

## Extending Functionality

### Adding a New Tower Type

1. **Add to `TOWER_CONFIG`**:
```javascript
myTower: { 
    cost: 120, damage: 30, range: 80, attackSpeed: 0.6, 
    color: 0xff00aa, projectileColor: 0xff00aa, 
    projectileSpeed: 500, special: 'poison' 
}
```

2. **Add tower icon in `index.html`**:
```html
<div class="tower-card" data-type="myTower">
    <div class="tower-icon">🎯</div>
    <div class="tower-name">My Tower</div>
    <div class="tower-cost">120g</div>
    <div class="tower-stats">Poison!</div>
</div>
```

3. **Add CSS styling in `index.html`**:
```css
.tower-card[data-type="myTower"] .tower-icon {
    background: #ff00aa;
    box-shadow: 2px 2px 0 #000, 0 0 10px #ff00aa;
}
```

4. **Add tower mesh shape in `createTowerMesh()`**:
```javascript
} else if (type === 'myTower') {
    top = this.createPixelRect(16, 20, config.color, 0xffffff);
}
```

5. **Handle special effects in `fireProjectile()` or `hitEnemy()`**:
```javascript
if (tower.special === 'poison') {
    // Poison damage over time logic
}
```

### Adding a New Enemy Type

1. **Add to `ENEMY_CONFIG`**:
```javascript
boss: { hp: 500, speed: 20, reward: 100, color: 0xff0000, size: 30 }
```

2. **Add spawn to waves**:
```javascript
// In generateWaves()
if (i % 10 === 0) {  // Every 10th wave
    wave.enemies.push({ type: 'boss', count: 1 });
}
```

3. **Add special behavior in `updateEnemies()`**:
```javascript
if (enemy.type === 'boss' && enemy.hp < enemy.maxHP * 0.3) {
    // Boss enrage mode - increase speed
    enemy.speed = config.speed * 1.5;
}
```

### Adding a New Wave Type

Modify the `generateWaves()` function to create special wave patterns:

```javascript
// Boss wave every 10th wave
if (i % 10 === 0) {
    wave.enemies = [
        { type: 'runner', count: 5 },
        { type: 'boss', count: 1 }
    ];
    wave.delay = 500; // Slower spawns
}
// Endless mode after wave 100
else if (i > 100) {
    wave.enemies = [...]; // Scale infinitely
}
```

### Modifying Enemy Path

**Location**: `getPathPoints()` function

The path is defined as waypoints. Enemies lerp between consecutive points:

```javascript
getPathPoints() {
    return [
        new THREE.Vector3(-420, 0, 0),    // Start (left side)
        new THREE.Vector3(-210, 0, 0),    // Turn point
        new THREE.Vector3(-210, 150, 0),  // Go up
        new THREE.Vector3(90, 150, 0),    // Go right
        new THREE.Vector3(90, -120, 0),   // Go down
        new THREE.Vector3(270, -120, 0),  // Turn
        new THREE.Vector3(270, 0, 0),    // Approach tower
        new THREE.Vector3(450, 0, 0)     // Exit (off screen)
    ];
}
```

### Adding New Particle Effects

**Location**: `spawnParticles()` function

```javascript
spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const geo = new THREE.BoxGeometry(size, size, 4);
        const mat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        
        // Set initial position
        mesh.position.set(x + offsetX, y + offsetY, z);
        this.scene.add(mesh);
        
        // Add to particles array
        this.particles.push({
            mesh,
            velocity: { x: vx, y: vy },
            life: duration
        });
    }
}
```

### Adding New UI Elements

Add HTML in `index.html`:
```html
<div id="new-element">Content</div>
```

Add CSS in `index.html`:
```css
#new-element {
    position: absolute;
    top: 20px;
    right: 20px;
    /* styling */
}
```

Update in `game.js`:
```javascript
updateUI() {
    document.getElementById('new-element').textContent = newValue;
}
```

---

## Technical Details

### Camera System
- **Type**: Orthographic camera
- **Aspect**: 16:9 ratio maintained on resize
- **View bounds**: ±400 x, ±225 y (adjusts with aspect)

### Grid System
- **Cell size**: 30×30 pixels
- **Grid range**: x: -390 to 390, y: -210 to 210
- **Path width**: ~30 pixels (enemies walk center)

### Collision Detection
- Tower range: Circle collision (distance check)
- Splash damage: Circle collision (distance from impact)
- Path collision: Pre-computed Set lookup

### Performance Considerations
- Object pooling recommended for projectiles/particles at scale
- Tower targeting: O(n×m) where n=towers, m=enemies
- Consider spatial partitioning for 50+ towers

---

## AI Extension Guidelines

### For AI Development

1. **Game State Access**:
```javascript
// Current game state available to AI
gameState = {
    gold: game.gold,
    towerHP: game.towerHP,
    currentWave: game.currentWave,
    towers: game.towers.map(t => ({
        x: t.gridX, y: t.gridY,
        type: t.type, damage: t.damage
    })),
    enemies: game.enemies.map(e => ({
        x: e.mesh.position.x, y: e.mesh.position.y,
        hp: e.hp, type: e.type, speed: e.speed
    })),
    waveInProgress: game.waveInProgress
}
```

2. **Actions Available**:
- `game.selectTower(type)` - Select tower type
- `game.placeTower(x, y, type)` - Place tower
- `game.cancelPlacement()` - Cancel selection

3. **Strategic Considerations**:
   - Place towers at path turns (maximum coverage)
   - Balance tower types: damage vs crowd control
   - Sniper for long-range; Freeze/Lightning for crowds
   - Save gold for expensive but powerful towers

### Suggested AI Approaches
- **Greedy**: Place highest damage tower at best position
- **Coverage-based**: Maximize path coverage with range
- **Wave-aware**: Save gold for difficult waves
- **Reinforcement Learning**: Learn from game outcomes

---

## Browser Compatibility

- **Requires**: WebGL support, Web Audio API
- **Tested**: Chrome, Firefox, Safari (modern versions)
- **Mobile**: Playable but optimized for desktop

---

## License

This game is open source. Feel free to modify and extend!

---

## Credits

- Game built with [Three.js](https://threejs.org/)
- Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) from Google Fonts
- Music: Original composition (customizable)
