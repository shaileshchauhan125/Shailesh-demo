class AIPlayer {
    constructor() {
        // Constants defining the game rules and board layout.
        this.GAME_CONSTANTS = {
            TOTAL_SQUARES: 52,
            HOME_PATH_LENGTH: 6,
            START_POSITIONS: { red: 1, green: 14, yellow: 27, blue: 40 },
            HOME_ENTRANCES: { red: 51, green: 12, yellow: 25, blue: 38 },
            HOME_PATH_PREFIXES: { red: 100, green: 200, yellow: 300, blue: 400 },
            SAFE_SPOTS: [1, 9, 14, 22, 27, 35, 40, 48],
        };
    }

    /**
     * Calculates the progress of a single token as a ratio from 0 to 1.
     * @param {object} token The token object { position, isHome }
     * @param {string} color The color of the token
     * @returns {number} Progress ratio (0 to 1)
     */
    _getTokenProgress(token, color) {
        if (token.position === -1) return 0; // In base
        if (token.isHome) return 1; // Reached home

        const totalPathLength = this.GAME_CONSTANTS.TOTAL_SQUARES + this.GAME_CONSTANTS.HOME_PATH_LENGTH;
        let progress = 0;

        if (token.position > 100) { // In home path
            const homePathProgress = token.position % 100;
            // A token's journey on the main path is 51 steps.
            progress = 51 + homePathProgress;
        } else { // On main path
            const startPos = this.GAME_CONSTANTS.START_POSITIONS[color];

            if (token.position >= startPos) {
                progress = token.position - startPos + 1;
            } else { // Wrapped around the board
                progress = (this.GAME_CONSTANTS.TOTAL_SQUARES - startPos) + token.position + 1;
            }
        }

        return progress / totalPathLength;
    }

    /**
     * Checks if a given board position is a safe spot.
     * @param {number} position The position to check.
     * @returns {boolean} True if the spot is safe.
     */
    _isPositionSafe(position) {
        return this.GAME_CONSTANTS.SAFE_SPOTS.includes(position);
    }

    /**
     * Counts how many of a player's tokens are on safe spots.
     * @param {string} playerColor The color of the player.
     * @param {object} gameState The game state.
     * @returns {number} The number of tokens on safe spots.
     */
    _countSafeTokens(playerColor, gameState) {
        return gameState.players[playerColor].filter(token => this._isPositionSafe(token.position)).length;
    }

    /**
     * Counts how many of a player's tokens are in a vulnerable position.
     * A token is vulnerable if it's on the main path and not on a safe spot.
     * @param {string} playerColor The color of the player to check.
     * @param {object} gameState The current game state.
     * @returns {number} The number of vulnerable tokens.
     */
    _countVulnerableTokens(playerColor, gameState) {
        return gameState.players[playerColor].filter(token =>
            token.position > 0 && token.position <= 52 && !this._isPositionSafe(token.position)
        ).length;
    }

    /**
     * Counts how many of a player's tokens have reached home.
     * @param {string} playerColor The color of the player.
     * @param {object} gameState The game state.
     * @returns {number} The number of tokens at home.
     */
    _countTokensAtHome(playerColor, gameState) {
        return gameState.players[playerColor].filter(token => token.isHome).length;
    }

    /**
     * Evaluates the strategic value of blockades for a player.
     * A blockade is 2 or more tokens of the same color on the same square.
     * @param {string} playerColor The color of the player.
     * @param {object} gameState The game state.
     * @returns {number} A score for blockade potential.
     */
    _evaluateBlockadePotential(playerColor, gameState) {
        let blockadeScore = 0;
        const positions = {};
        const playerTokens = gameState.players[playerColor];

        for (const token of playerTokens) {
            if (token.position > 0 && token.position <= 52) {
                positions[token.position] = (positions[token.position] || 0) + 1;
            }
        }

        for (const pos in positions) {
            if (positions[pos] > 1) {
                // A blockade is more valuable on a non-safe spot, as it blocks opponents.
                // On a safe spot, it's just good positioning.
                blockadeScore += this._isPositionSafe(parseInt(pos)) ? 5 : 10;
            }
        }
        return blockadeScore;
    }

    /**
     * Counts how many of the player's tokens are under immediate threat from an opponent.
     * A token is threatened if it's on a non-safe spot and an opponent is within 6 squares behind it.
     * @param {string} playerColor The color of the player whose tokens are at risk.
     * @param {object} gameState The game state.
     * @returns {number} The number of tokens under immediate threat.
     */
    _countImmediateThreats(playerColor, gameState) {
        let threatCount = 0;
        const playerTokens = gameState.players[playerColor];

        for (const token of playerTokens) {
            if (token.position <= 0 || token.position > 52 || this._isPositionSafe(token.position)) {
                continue;
            }

            let isThreatened = false;
            for (const opponentColor in gameState.players) {
                if (opponentColor === playerColor) continue;

                for (const opponentToken of gameState.players[opponentColor]) {
                    if (opponentToken.position <= 0 || opponentToken.isHome) continue;

                    // Calculate distance on the circular path from opponent to player token
                    let distance = token.position - opponentToken.position;
                    if (distance < 0) {
                        distance += this.GAME_CONSTANTS.TOTAL_SQUARES;
                    }

                    if (distance > 0 && distance <= 6) {
                        isThreatened = true;
                        break;
                    }
                }
                if (isThreatened) break;
            }
            if (isThreatened) {
                threatCount++;
            }
        }
        return threatCount;
    }

    // Placeholder for the main AI decision logic, to be implemented in the next steps.
    chooseMove(gameState, movableTokens) {
        // This will be replaced with logic that uses the helper functions.
        // For now, it just returns the first possible move.
        return movableTokens[0];
    }

    /**
     * Determines the current phase of the game for a player.
     * @param {string} playerColor The color of the player.
     * @param {object} gameState The current game state.
     * @returns {string} The game phase: 'EARLY_GAME', 'MID_GAME', or 'END_GAME'.
     */
    _getGamePhase(playerColor, gameState) {
        const playerTokens = gameState.players[playerColor];
        const tokensOutOfBase = playerTokens.filter(t => t.position !== -1).length;
        const tokensInHomePath = playerTokens.filter(t => t.position > 100).length;
        const tokensHome = this._countTokensAtHome(playerColor, gameState);

        if (tokensHome >= 2 || (tokensInHomePath > 0 && tokensOutOfBase === 4)) {
            return 'END_GAME';
        }
        if (tokensOutOfBase >= 2) {
            return 'MID_GAME';
        }
        return 'EARLY_GAME';
    }

    /**
     * The core heuristic evaluation function.
     * Analyzes a game state and returns a score indicating how favorable it is for the AI.
     * @param {object} gameState - The game state to evaluate.
     * @param {string} playerColor - The color of the AI player.
     * @param {object} moveDetails - Details about the move that led to this state, e.g., { captureOccurred, tokenLeftYard }.
     * @returns {number} The evaluated score of the game state.
     */
    evaluateState(gameState, playerColor, moveDetails = {}) {
        let score = 0;
        const playerTokens = gameState.players[playerColor];

        const weights = {
            progress: 200,
            homeCompletion: 500,
            safety: 100,
            vulnerability: -150,
            capture: 300,
            blockade: 50,
            threat: -200,
            tokenOutOfYard: 350
        };

        const gamePhase = this._getGamePhase(playerColor, gameState);
        if (gamePhase === 'EARLY_GAME') {
            weights.tokenOutOfYard = 400; // Heavily prioritize getting tokens out early
            weights.safety = 150;
            weights.capture = 200;
        } else if (gamePhase === 'END_GAME') {
            weights.progress = 250;
            weights.homeCompletion = 600;
            weights.blockade = -100; // Penalize blockades that need to be broken up
            weights.threat = -300;
        }

        // 1. Progress Component
        let totalProgress = 0;
        playerTokens.forEach(token => {
            totalProgress += this._getTokenProgress(token, playerColor);
        });
        score += weights.progress * totalProgress;

        // 2. Home Completion Bonus
        const tokensHome = this._countTokensAtHome(playerColor, gameState);
        score += weights.homeCompletion * tokensHome;
        if (tokensHome === 4) return 100000; // Winning state

        // 3. Safety Assessment
        const safeTokens = this._countSafeTokens(playerColor, gameState);
        const vulnerableTokens = this._countVulnerableTokens(playerColor, gameState);
        score += weights.safety * safeTokens;
        score += weights.vulnerability * vulnerableTokens;

        // 4. Capture Bonus (from the move leading to this state)
        if (moveDetails.captureOccurred) {
            score += weights.capture;
        }

        // 5. Strategic Positioning (Blockades)
        score += weights.blockade * this._evaluateBlockadePotential(playerColor, gameState);

        // 6. Threat Analysis
        const threats = this._countImmediateThreats(playerColor, gameState);
        score += weights.threat * threats;

        // 7. Token Out of Yard Bonus
        if (moveDetails.tokenLeftYard) {
            score += weights.tokenOutOfYard;
        }

        // 8. Opponent Evaluation (simple version)
        let opponentScore = 0;
        for (const color in gameState.players) {
            if (color === playerColor) continue;
            let tempOpponentScore = 0;
            gameState.players[color].forEach(token => {
                tempOpponentScore += this._getTokenProgress(token, color) * weights.progress;
            });
            tempOpponentScore += this._countTokensAtHome(color, gameState) * weights.homeCompletion;
            opponentScore += tempOpponentScore;
        }
        score -= opponentScore * 0.3; // Factor in opponent progress negatively

        return score;
    }
}

// Make the AIPlayer class available globally for now.
window.AIPlayer = AIPlayer;
