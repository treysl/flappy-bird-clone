# Flappy Bird Clone

A Flappy Bird clone game that works both in the browser and as a standalone Windows application.

## Features

- Classic Flappy Bird gameplay
- Three difficulty modes: Easy, Regular, and Insane
- Coin collection system with different coin values
- Parallax scrolling background
- Animated coin sprites
- Background music with playlist
- High score tracking (stored locally)
- Responsive design (works on desktop and mobile)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Install Dependencies

```bash
npm install
```

## Running the Game

### Option 1: Standalone Application (Electron)

Run the game as a standalone Windows application:

```bash
npm start
```

This will open the game in an Electron window.

### Option 2: Browser Version

Simply open `index.html` directly in your web browser:

1. Navigate to the project folder
2. Double-click `index.html` (or right-click → Open with → your browser)

The game works identically in both modes - same features, same gameplay, same experience!

## Building for Distribution

### Build Windows Executable

To create a distributable Windows application:

```bash
npm run build:win
```

The built application will be in the `dist` folder.

### Build for Other Platforms

To build for all platforms:

```bash
npm run build
```

## Game Controls

- **SPACE** or **Click/Tap** - Flap the bird
- Avoid the pipes and don't hit the ground or ceiling
- Collect coins to increase your score

## Difficulty Modes

- **Easy**: Slower gravity, fewer coins
- **Regular**: Standard difficulty, balanced gameplay
- **Insane**: Faster game speed, more coins to collect

## Scoring

Your score is calculated as:
- **Pipes Passed**: Points for each pipe you successfully navigate
- **Coins Collected**: Additional points from collecting coins (values: 2, 5, or 10)
- **Grand Total**: Your final score (pipes + coins)

## Technical Details

- Built with vanilla JavaScript (no frameworks)
- Uses HTML5 Canvas for rendering
- Electron for desktop application
- LocalStorage for high score persistence
- Responsive canvas that adapts to screen size

## File Structure

```
flappy-bird-clone/
├── assets/              # Game assets (images, audio)
│   ├── background/      # Parallax background layers
│   └── Flappy Pigeon Soundtrack/  # Background music
├── fonts/               # Custom fonts
├── dist/                # Built application (after build)
├── game.js              # Main game logic
├── index.html           # HTML structure (open directly in browser)
├── main.js              # Electron main process
├── styles.css           # Game styling
└── package.json         # Project configuration
```

## Development

The game code is platform-agnostic and works identically in both browser and Electron contexts. All asset paths are relative and work in both environments.

## License

MIT

## Credits

- Background music: Flappy Pigeon Soundtrack
- Custom pixel art assets
