# Heroll - Roguelike Board Game RPG

A 2D pixel art roguelike board-game RPG built with Phaser 3 and TypeScript. Roll dice to move around a circular board, fight enemies, collect treasure, and progress through increasingly difficult floors!

## Features

- **Circular Board Gameplay**: Roll dice to move around a looping board with different tile types
- **Turn-Based Combat**: Strategic combat system with attack, defend, and run options
- **Progression System**: Level up your hero, gain stats, and collect coins
- **Multiple Tile Types**:
  - Enemy tiles → Turn-based combat encounters
  - Treasure tiles → Collect coins and items
  - Shop tiles → Buy equipment and consumables
  - Event tiles → Random effects (healing, traps, stat boosts)
  - Boss tiles → Challenging fights that advance floors
- **Save System**: Automatic save/load functionality using localStorage
- **Responsive Design**: Works on both desktop and mobile browsers

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:8080`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How to Play

1. **Start**: Click "New Game" from the main menu
2. **Movement**: Click "ROLL DICE" to roll 1-6 and move that many spaces
3. **Tile Events**: Each tile triggers different events:
   - Fight enemies in turn-based combat
   - Collect treasure for coins
   - Visit shops (coming soon)
   - Experience random events
   - Face bosses to advance floors
4. **Combat**: Choose to Attack, Defend, or Run during battles
5. **Progression**: Gain experience to level up and increase your stats

## Technical Stack

- **Frontend**: Phaser 3 game engine
- **Language**: TypeScript
- **Build Tool**: Webpack
- **Styling**: CSS3
- **Storage**: localStorage for save data

## Project Structure

```
src/
├── main.ts              # Game initialization
├── types/
│   └── GameTypes.ts     # Type definitions
├── managers/
│   └── GameManager.ts   # Core game logic and state
└── scenes/
    ├── MenuScene.ts     # Main menu
    ├── GameScene.ts     # Main gameplay
    └── CombatScene.ts   # Turn-based combat
```

## Future Enhancements

- Shop system with equipment and consumables
- More enemy types and boss varieties
- Equipment system with weapons and armor
- Sound effects and background music
- Particle effects and animations
- Online leaderboards
- More random events and tile types

## Contributing

Feel free to submit issues and pull requests to help improve the game!

## License

MIT License