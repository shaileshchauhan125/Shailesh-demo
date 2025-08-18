class Game {
    constructor(players, onStateChange) {
        this.players = {};
        this.playerConfigs = players.map(p => ({ color: p.color, type: 'human', id: p.id })); // Store player IDs
        
        // Ensure turn order is always red → green → yellow → blue
        const turnOrder = ['red', 'green', 'yellow', 'blue'];
        const playerColors = players.map(p => p.color);
        this.activeColors = turnOrder.filter(color => playerColors.includes(color));
        
        this.currentPlayerIndex = 0;
        this.diceValue = null;
        this.turnState = 'rolling';
        this.movableTokens = [];
        this.winner = null;
        this.turnStartTime = Date.now();
        this.turnDuration = 30000;
        this.onStateChange = onStateChange;
        this.turnTimer = null;
        this.consecutiveSixes = 0; // Track consecutive sixes

        this.initializePlayers();
        this.startTurn(); // Initialize turn immediately
        
        // Broadcast state after short delay to ensure proper setup
        setTimeout(() => {
            this.broadcastState();
        }, 100);
    }

    initializePlayers() {
        this.activeColors.forEach(color => {
            this.players[color] = [
                { id: 0, position: -1, isHome: false },
                { id: 1, position: -1, isHome: false },
                { id: 2, position: -1, isHome: false },
                { id: 3, position: -1, isHome: false }
            ];
        });
    }

    getCurrentPlayer() {
        return this.activeColors[this.currentPlayerIndex];
    }

    getCurrentPlayerConfig() {
        const currentColor = this.getCurrentPlayer();
        return this.playerConfigs.find(p => p.color === currentColor);
    }

    rollDice(playerId) {
        // Verify it's the correct player's turn
        const currentPlayerColor = this.getCurrentPlayer();
        const isCurrentPlayer = this.playerConfigs.some(p => p.id === playerId && p.color === currentPlayerColor);
        
        if (!isCurrentPlayer || this.turnState !== 'rolling' || this.winner) return;

        this.diceValue = Math.floor(Math.random() * 6) + 1;
        
        if (this.diceValue === 6) {
            this.consecutiveSixes++;
        } else {
            this.consecutiveSixes = 0;
        }

        if (this.consecutiveSixes === 3) {
            // Penalty for rolling three 6s
            this.lastMoveEvents = { tripleSixPenalty: true };
            this.endTurn(); // This also resets consecutiveSixes
            this.broadcastState();
            return;
        }
        
        this.turnState = 'moving';
        this.updateMovableTokens();

        if (this.movableTokens.length === 0) {
            setTimeout(() => this.endTurn(), 1500);
        } else if (this.movableTokens.length === 1) {
            // Auto-move if only one possible move
            const autoMoveToken = this.movableTokens[0];
            setTimeout(() => {
                this.moveToken(playerId, autoMoveToken.color, autoMoveToken.id);
            }, 1000); // Small delay to show the dice result
        }
        
        this.broadcastState();
    }

    updateMovableTokens() {
        this.movableTokens = [];
        const currentColor = this.getCurrentPlayer();
        const tokens = this.players[currentColor];

        tokens.forEach(token => {
            if (this.canMoveToken(currentColor, token.id)) {
                this.movableTokens.push({ color: currentColor, id: token.id });
            }
        });
    }

    canMoveToken(color, tokenId) {
        const token = this.players[color][tokenId];
        
        if (token.isHome) return false;
        
        if (token.position === -1) {
            return this.diceValue === 6;
        }
        
        const newPosition = this.calculateNewPosition(color, token.position, this.diceValue);
        return newPosition !== null;
    }

    calculateNewPosition(color, currentPosition, steps) {
        if (currentPosition === -1) {
            if (steps === 6) {
                return this.getStartPosition(color);
            }
            return null;
        }
        
        if (currentPosition > 100) {
            const homePrefix = this.getHomePathPrefix(color);
            const homePathIndex = currentPosition - homePrefix;
            const newHomeIndex = homePathIndex + steps;
            if (newHomeIndex > 6) return null;
            if (newHomeIndex === 6) return -2;
            return homePrefix + newHomeIndex;
        }
        
        const newPos = (currentPosition - 1 + steps) % 52 + 1;
        const homeEntrance = this.getHomeEntrancePosition(color);
        
        const crossedHome = (currentPosition <= homeEntrance && currentPosition + steps > homeEntrance);
        if (crossedHome) {
            const stepsIntoHome = (currentPosition + steps) - homeEntrance;
            if (stepsIntoHome > 6) return null;
            if (stepsIntoHome === 6) return -2;
            return this.getHomePathPrefix(color) + stepsIntoHome;
        }
        
        return newPos;
    }

    getStartPosition(color) {
        const startPositions = { red: 1, green: 14, yellow: 27, blue: 40 };
        return startPositions[color];
    }

    getHomeEntrancePosition(color) {
        const homeEntrances = { red: 51, green: 12, yellow: 25, blue: 38 };
        return homeEntrances[color];
    }

    getHomePathPrefix(color) {
        const homePrefixes = { red: 100, green: 200, yellow: 300, blue: 400 };
        return homePrefixes[color];
    }

    moveToken(playerId, color, tokenId) {
        // Verify it's the correct player's turn and color
        const currentPlayerColor = this.getCurrentPlayer();
        const isCurrentPlayer = this.playerConfigs.some(p => p.id === playerId && p.color === currentPlayerColor);
        
        if (!isCurrentPlayer || this.turnState !== 'moving' || currentPlayerColor !== color || this.winner) return;
        
        const token = this.players[color][tokenId];
        const newPosition = this.calculateNewPosition(color, token.position, this.diceValue);
        
        if (newPosition === null) return;
        
        let captureOccurred = false;
        if (newPosition > 0 && newPosition <= 52) {
            captureOccurred = this.handleCapture(newPosition, color);
        }
        
        if (newPosition === -2) {
            token.isHome = true;
            token.position = -2;
        } else {
            token.position = newPosition;
        }
        
        this.checkWinner();
        
        const reachedHome = (newPosition === -2);

        // Set events for this move
        this.lastMoveEvents = { capture: captureOccurred, home: reachedHome };
        
        if ((this.diceValue === 6 || captureOccurred || reachedHome) && !this.winner) {
            this.turnState = 'rolling';
            this.turnStartTime = Date.now();
        } else {
            this.endTurn();
        }
        
        this.broadcastState();
    }

    handleCapture(position, movingColor) {
        const safeSpots = [1, 9, 14, 22, 27, 35, 40, 48];
        if (safeSpots.includes(position)) return false;
        
        let captured = false;
        Object.keys(this.players).forEach(color => {
            if (color === movingColor) return;
            
            this.players[color].forEach(token => {
                if (token.position === position) {
                    token.position = -1;
                    captured = true;
                }
            });
        });
        return captured;
    }

    checkWinner() {
        for (const color of this.activeColors) {
            const allHome = this.players[color].every(token => token.isHome);
            if (allHome) {
                this.winner = color;
                break;
            }
        }
    }

    endTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.activeColors.length;
        this.diceValue = null;
        this.turnState = 'rolling';
        this.movableTokens = [];
        this.turnStartTime = Date.now();
        this.consecutiveSixes = 0; // Reset consecutive sixes when turn ends
        
        this.startTurn();
        this.broadcastState();
    }

    startTurn() {
        this.turnStartTime = Date.now();
        this.turnEndsAt = this.turnStartTime + this.turnDuration;
        
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
        }
        
        this.turnTimer = setTimeout(() => {
            if (this.turnState === 'rolling') {
                this.endTurn();
            }
        }, this.turnDuration);
    }

    broadcastState() {
        const gameState = {
            players: this.players,
            currentPlayerColor: this.getCurrentPlayer(),
            diceValue: this.diceValue,
            turnState: this.turnState,
            movableTokens: this.movableTokens,
            winner: this.winner,
            turnEndsAt: this.turnEndsAt,
            isLocalGame: false,
            currentPlayerType: 'human',
            lastMoveEvents: this.lastMoveEvents || null
        };
        
        if (this.onStateChange) {
            this.onStateChange(gameState);
        }
        this.lastMoveEvents = null; // Reset after broadcasting
    }

    getState() {
        return {
            players: this.players,
            currentPlayerColor: this.getCurrentPlayer(),
            diceValue: this.diceValue,
            turnState: this.turnState,
            movableTokens: this.movableTokens,
            winner: this.winner,
            turnEndsAt: this.turnEndsAt,
            isLocalGame: false,
            currentPlayerType: 'human'
        };
    }

    removePlayer(playerId) {
        // Find and remove player configuration
        const playerIndex = this.playerConfigs.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            const playerColor = this.playerConfigs[playerIndex].color;
            
            // Remove from configurations
            this.playerConfigs.splice(playerIndex, 1);
            
            // Remove from active colors
            const colorIndex = this.activeColors.indexOf(playerColor);
            if (colorIndex !== -1) {
                this.activeColors.splice(colorIndex, 1);
            }
            
            // Remove player tokens
            delete this.players[playerColor];
            
            // Adjust current player index if needed
            if (this.currentPlayerIndex >= this.activeColors.length) {
                this.currentPlayerIndex = 0;
            }
            
            // If no players left, end the game
            if (this.activeColors.length === 0) {
                this.winner = 'No players remaining';
            }
        }
    }

    handleTurnTimeout(playerId) {
        // Check if it's actually this player's turn
        const currentPlayerConfig = this.getCurrentPlayerConfig();
        if (currentPlayerConfig && currentPlayerConfig.id === playerId) {
            // End turn automatically when timeout occurs
            this.endTurn();
            this.broadcastState();
        }
    }
}

module.exports = Game;