# Ludo Multiplayer

A fast, modern, and highly polished Ludo game with Online Multiplayer and Local (Human vs AI) modes. Built with Node.js, Express, and Socket.IO on the backend and a custom-rendered board on the frontend. Comes with animated themes, sound, smart turn logic, and a slick lobby experience.

This game is now a fully functional Progressive Web App (PWA) that can be installed on mobile devices and played offline!

## ✨ Features

* **Online Multiplayer**: Play with up to 4 players in a private room.
* **Local Mode**: Play against friends or AI on a single device.
* **AI Player**: A smart AI opponent with configurable difficulty.
* **Step-by-Step Token Animations**: Smooth, step-by-step token movement animations using GSAP.
* **Animated Themes**: Choose from four animated themes: Cyberpunk, Ancient Egypt, Jurassic Jungle, and Outer Space.
* **Sound Effects**: A rich set of sound effects for an immersive experience.
* **In-Game Chat**: Communicate with other players in the game room.
* **Smart UX**: Auto-move when only one token can move, bonus turns on six, and capture bonuses.
* **Responsive UI**: The game is designed to work on all screen sizes.
* **Persistent Settings**: Your theme, mute, and chat visibility preferences are saved locally.
* **Progressive Web App (PWA)**:
  * **Installable**: Add to your home screen on mobile or desktop
  * **Offline Play**: Local games work completely offline
  * **Fast Loading**: Assets cached for quick startup
  * **Auto-Updates**: Service worker handles background updates
  * **Cross-Platform**: Works on iOS, Android, and Desktop browsers

## 🎮 Game Rules & Mechanics

* **Turn Order**: Red → Green → Yellow → Blue
* **Dice Roll Timer**: 30 seconds per turn in online multiplayer.
* **Starting a Token**: Requires a roll of 6.
* **Safe Spots**: 1, 9, 14, 22, 27, 35, 40, 48 (tokens on these spots cannot be captured).
* **Captures**: Landing on a square occupied by an opponent sends their token back to their base. Capturing grants an extra roll.
* **Home Path**: Each color has its own home path, which can only be entered by that color's tokens.
* **Bonus Turns**: An extra turn is granted for rolling a 6, capturing an opponent's token, or moving a token to the home space.
* **Triple Six Penalty**: Rolling three consecutive 6s results in a penalty, and the turn is passed to the next player.

## 📸 Screenshots

### Lobby
![Lobby](/public/screenshots/lobby.png)

### Gameplay
![Gameplay](/public/screenshots/gameplay.png)

## 🚀 Quick Start

### Prerequisites

* Node.js 18+

### Installation

```bash
npm install
```

### Running the Game

```bash
npm start
```

The server will start on `http://localhost:3000`.


## 🛠️ Development

### Architecture

* **Backend**: Node.js, Express, Socket.IO (`src/server.js`, `src/game.js`)
* **Frontend**: HTML, CSS, JavaScript, GSAP (`public/`)
* **AI**: `public/ai-player.js`
* **Local Game Logic**: `public/local-game.js`
* **PWA Components**:
  * **Manifest**: `public/manifest.json`
  * **Service Worker**: `public/sw.js`
  * **PWA Manager**: `public/pwa.js`
  * **Offline Support**: `public/offline.html`

### Contributing

We welcome contributions to this project! We use a simple branching model for development:

### Testing

The game includes a suite of tests to ensure its correctness. You can find the test files in the `testings` folder. To run the tests, use the following command:

```bash
node testings/test-game-rules.js
```

## ✅ Deployment

The game is ready for production. The `main` branch is stable and can be deployed.

### Verification Checklist

* **Core Game Rules**: All rules have been tested and verified.
* **Animation System**: The animation system is fully functional and has been tested in both local and online modes.
* **Multiplayer**: Both local and online multiplayer modes are working correctly.
* **UI/UX**: The UI is responsive and works on all screen sizes.
* **Performance**: The game is performant and has no memory leaks.
* **PWA Features**: All PWA features are working correctly (install, offline, caching)

### Deploying to Netlify

This project includes deployment scripts for Windows (`deploy.bat`) and Unix-like systems (`deploy.sh`) that automate the process of pushing to GitHub

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.