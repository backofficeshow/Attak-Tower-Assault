# Attak — Tower Assault Game Specification

## 1. Project Overview

**Project Name:** Attak  
**Type:** Browser-based Tower Defense/Assault Game  
**Core Functionality:** Players defend their tower against waves of incoming enemies by strategically placing defensive towers. Enemies spawn from entry points and path toward the player's tower. If enemies reach the tower, it takes damage. Survive all waves to win.  
**Target Users:** Casual gamers looking for strategic browser gameplay

---

## 2. Visual & Rendering Specification

### Scene Setup
- **Renderer:** Three.js WebGL with 2D orthographic camera (top-down view)
- **Canvas:** Full viewport, responsive
- **Background:** Dark tactical grid pattern with subtle glow effects
- **Color Palette:** 
  - Primary: Deep navy (#0a0e1a) background
  - Accent: Cyan (#00d4ff) for friendly elements
  - Danger: Crimson (#ff3366) for enemies
  - Gold: (#ffd700) for currency/rewards
  - Success: Emerald (#00ff88) for kills/positive feedback

### Visual Style
- **Aesthetic:** Cyberpunk/tactical with glowing neon elements
- **Geometry:** Stylized low-poly 3D shapes for towers, enemies, projectiles
- **Effects:**
  - Bloom/glow on projectiles and UI elements
  - Particle explosions on enemy death
  - Pulsing range indicators when placing towers
  - Screen shake on tower damage

### UI Elements
- **Top Bar:** Wave counter, Tower HP bar, Currency display
- **Bottom Panel:** Tower selection cards with stats and cost
- **Side Indicators:** Kill count, current wave progress
- **Fonts:** "Orbitron" for headers, "Rajdhani" for stats (Google Fonts)

---

## 3. Game Mechanics Specification

### The Tower (Objective to Defend)
- **HP:** 100
- **Position:** Center-right of the map
- **Visual:** Glowing hexagonal core structure
- **Damage Feedback:** Flash red, particle burst, screen shake

### Enemies
- **Types:**
  1. **Runner** — Fast, low HP (10), worth 10 gold
  2. **Tank** — Slow, high HP (50), worth 25 gold
  3. **Swarm** — Medium speed, very low HP (3), spawns in groups, worth 5 gold

- **Behavior:** Path toward tower using predefined waypoints
- **Death Effect:** Burst into particles, fade out

### Defensive Towers
- **Placement:** Click tower card, then click valid grid position
- **Types:**
  1. **Laser Tower** — Fast attack speed, single target, 10 damage, cyan beam
  2. **Cannon Tower** — Slow attack, splash damage (small radius), 25 damage, orange projectile
  3. **Freeze Tower** — Slows enemies in range, 5 damage, blue pulse effect

- **Stats:**
  | Tower   | Cost | Damage | Range | Attack Speed | Special        |
  |---------|------|--------|-------|--------------|----------------|
  | Laser   | 50   | 10     | 120px | Fast         | Single target  |
  | Cannon  | 100  | 25     | 100px | Slow         | Splash damage  |
  | Freeze  | 75   | 5      | 100px | Medium       | 50% slow for 2s|

### Waves
- **Total Waves:** 10
- **Scaling:** Each wave increases enemy count and introduces harder types
- **Wave 1-3:** Runners only
- **Wave 4-6:** Runners + Tanks
- **Wave 7-10:** All types, increasing density
- **Inter-wave:** 10-second countdown, bonus gold

### Economy
- **Starting Gold:** 150
- **Earn Gold:** Kill enemies + wave completion bonus
- **Wave Bonus:** 50 + (wave_number * 10)

---

## 4. Interaction Specification

### Controls
- **Mouse Click:** Select tower from panel
- **Mouse Click (on grid):** Place selected tower (if valid position and sufficient gold)
- **Mouse Hover:** Show tower range preview
- **Right Click / ESC:** Cancel tower placement

### UI Interactions
- Tower cards highlight on hover with glow effect
- Insufficient gold: card appears dimmed, shows "Not enough gold" tooltip
- Successful placement: satisfying "deploy" sound effect
- Invalid placement: red flash, placement denied

### Audio (Web Audio API)
- **Background:** Subtle ambient synth drone
- **Shoot:** Pew sound for laser, boom for cannon, chime for freeze
- **Enemy Death:** Crunch/explosion sound
- **Tower Damage:** Warning alarm, heavy impact
- **Wave Start:** Ominous horn/drone

---

## 5. Technical Implementation

### File Structure
```
/mnt/extbod/localwork/tower/
├── index.html      # Main entry point
├── game.js         # Core game logic
├── towers.js       # Tower definitions and behaviors
├── enemies.js      # Enemy types and spawning
├── particles.js    # Particle system
├── ui.js           # UI management
├── audio.js        # Sound effects
└── SPEC.md         # This file
```

### Grid System
- 16:9 playable area
- Grid cells: 40x40 pixels
- Placement validation: No overlapping, within bounds, not on path

### Enemy Path
- Defined as array of waypoints
- Enemies lerp between waypoints
- Path visualized with subtle dotted line

---

## 6. Acceptance Criteria

1. ✅ Game loads in browser without errors
2. ✅ Tower can be selected and placed on valid grid positions
3. ✅ Towers attack enemies within range automatically
4. ✅ Enemies spawn in waves and path toward tower
5. ✅ Enemies take damage and die (with particle effect)
6. ✅ Currency updates on kills
7. ✅ Tower HP decreases when enemies reach it
8. ✅ Game over state when tower HP reaches 0
9. ✅ Victory state after surviving all 10 waves
10. ✅ All UI elements display correct information
11. ✅ Sound effects play for key actions
12. ✅ Responsive canvas sizing
