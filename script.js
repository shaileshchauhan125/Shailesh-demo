// script.js extracted from hello.html

document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('ludo-board');
    const status = document.getElementById('game-status');
    const winnerOverlay = document.getElementById('winner-overlay');
    const winnerMessage = document.getElementById('winner-message');
    const restartBtn = document.getElementById('restart-btn');
    
    // Player selection modal elements
    const playerSelectionModal = document.getElementById('player-selection-modal');
    const playerBtns = document.querySelectorAll('.player-btn');
    const playerColorSelection = document.getElementById('player-color-selection');
    const colorOptions = document.getElementById('color-options');
    const startGameBtn = document.getElementById('start-game-btn');
    const playerNameDisplay = document.getElementById('player-name-display');
    const backToLoginBtn = document.getElementById('back-to-login');
    const gameModeSubtitle = document.getElementById('game-mode-subtitle');
    const offlinePlayerSelection = document.getElementById('offline-player-selection');
    const onlineRoomJoin = document.getElementById('online-room-join');
    const joinPlayerNameInput = document.getElementById('join-player-name');
    const joinRoomGameBtn = document.getElementById('join-room-game-btn');
    const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
    
    // Individual player dice
    const playerDice = {
        red: document.getElementById('red-dice'),
        green: document.getElementById('green-dice'),
        yellow: document.getElementById('yellow-dice'),
        blue: document.getElementById('blue-dice')
    };
   
    // Game state variables
    let numberOfPlayers = 0;
    let activePlayers = [];
    let gameStarted = false;
    let isOnlineGame = false;
    let currentRoomData = null;
    let multiplayerClient = null; // For online game communication

    const allPlayers = ['red', 'green', 'yellow', 'blue'];
    const colors = { red: '#ff4d4d', green: '#4caf50', yellow: '#ffeb3b', blue: '#2196f3' };
    const playerNames = { red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue' };
    const startPositions = { red: 1, green: 14, yellow: 27, blue: 40 };
    // Each player enters their home path when they reach their home entrance after completing the lap
    const homeEntrances = { red: 52, green: 13, yellow: 26, blue: 39 };
    const homePaths = {
        red: [53, 54, 55, 56, 57, 58],    // Red home path (6 steps to center)
        green: [59, 60, 61, 62, 63, 64], // Green home path (6 steps to center)
        yellow: [65, 66, 67, 68, 69, 70], // Yellow home path (6 steps to center)
        blue: [71, 72, 73, 74, 75, 76]    // Blue home path (6 steps to center)
    };

    let currentPlayerIndex = 0;
    let diceValue = 0;
    let diceRolled = false;
    let tokens = {};

    // Player Selection Functions
    function initPlayerSelection() {
        // Check URL parameters first for room links
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId) {
            // User clicked on a room link
            handleRoomLink(roomId);
            return;
        }
        
        // Check if user came from login page
        const playerName = localStorage.getItem('playerName');
        const gameMode = localStorage.getItem('gameMode');
        
        if (!playerName) {
            // Redirect to login if no valid session
            window.location.href = 'index.html';
            return;
        }
        
        // Display player name
        playerNameDisplay.textContent = playerName;
        
        if (gameMode === 'online') {
            // Handle online game from lobby
            handleOnlineGameFromLobby();
        } else {
            // Handle offline game
            handleOfflineGameSelection();
        }
        
        // Add event listeners
        setupGameEventListeners();
    }
    
    function handleRoomLink(roomId) {
        // Show room join interface
        isOnlineGame = true;
        gameModeSubtitle.textContent = 'Joining Room...';
        offlinePlayerSelection.style.display = 'none';
        onlineRoomJoin.style.display = 'block';
        playerSelectionModal.style.display = 'flex';
        
        // Simulate checking if room exists
        setTimeout(() => {
            const roomExists = validateRoomId(roomId);
            
            if (roomExists) {
                showRoomJoinForm(roomId);
            } else {
                showRoomError();
            }
        }, 1500);
    }
    
    function handleOnlineGameFromLobby() {
        // User came from online lobby
        const roomData = localStorage.getItem('roomData');
        if (roomData) {
            currentRoomData = JSON.parse(roomData);
            isOnlineGame = true;
            
            // Initialize multiplayer client for online games
            initializeMultiplayerClient();
            
            // Auto-start online game with room data
            // Only assign real players, no bots in online mode
            activePlayers = currentRoomData.players.map((p, idx) => ['red', 'green', 'yellow', 'blue'][idx]);
            gameStarted = true;
            playerSelectionModal.style.display = 'none';
            
            // Determine local player color based on their position in the room
            const localPlayerName = localStorage.getItem('playerName');
            
            // Find the local player's index in the room and assign corresponding color
            let localPlayerIndex = -1;
            if (currentRoomData.players && Array.isArray(currentRoomData.players)) {
                localPlayerIndex = currentRoomData.players.findIndex(p => {
                    // Try different name matching strategies
                    return p.name === localPlayerName || 
                           p.name?.trim() === localPlayerName?.trim() ||
                           p.name?.toLowerCase() === localPlayerName?.toLowerCase();
                });
            }
            
            if (localPlayerIndex !== -1 && localPlayerIndex < activePlayers.length) {
                const localPlayerColor = activePlayers[localPlayerIndex];
                sessionStorage.setItem('localPlayerColor', localPlayerColor);
            } else {
                // Fallback: assign based on player count or default to red
                const fallbackColor = activePlayers[0] || 'red';
                sessionStorage.setItem('localPlayerColor', fallbackColor);
            }
            
            // Show dice for active players in online game
            allPlayers.forEach(player => {
                const dice = playerDice[player];
                if (activePlayers.includes(player)) {
                    dice.style.display = 'flex';
                } else {
                    dice.style.display = 'none';
                }
            });
            
            initGame();
            return;
        }
        
        // Fallback to offline if no room data
        handleOfflineGameSelection();
    }
    
    function initializeMultiplayerClient() {
        if (typeof LudoMultiplayerClient !== 'undefined') {
            multiplayerClient = new LudoMultiplayerClient();
            
            // Set up game update handler
            multiplayerClient.onGameUpdate = (eventType, gameState, players, actionType, actionData) => {
                
                if (actionType === 'dice_roll' || actionType === 'diceRoll') {
                    // Handle dice roll from other players
                    handleRemoteDiceRoll(actionData);
                } else if (actionType === 'move_token' || actionType === 'token_move' || actionType === 'tokenMove') {
                    // Handle token move from other players
                    handleRemoteTokenMove(actionData);
                } else if (actionType === 'next_turn' || actionType === 'turn_change' || actionType === 'turnChange') {
                    // Handle turn change
                    handleRemoteTurnChange(actionData);
                } else {
                }
            };
            
            // Connect to server
            multiplayerClient.connect().then(() => {
            }).catch(error => {
                console.error('Failed to connect multiplayer client:', error);
            });
        } else {
            console.error('LudoMultiplayerClient not available');
        }
    }
    
    function handleRemoteDiceRoll(diceData) {
        
        // Update dice value and current player state
        diceValue = diceData.value;
        
        // If player info is provided, update current player index
        if (diceData.playerIndex !== undefined) {
            currentPlayerIndex = diceData.playerIndex;
        }
        
        const currentPlayer = activePlayers[currentPlayerIndex];
        const currentDice = playerDice[currentPlayer];
        
        if (currentDice) {
            currentDice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceValue - 1];
            diceRolled = true;
            status.textContent = `${playerNames[currentPlayer]} rolled a ${diceValue}`;
            
            // Update dice state
            resetTurnVisuals();
            currentDice.classList.add('active');
            
            checkMovableTokens();
        } else {
            console.error('Could not find dice for player:', currentPlayer);
        }
    }
    
    function resetTurnVisuals() {
        // Reset all dice visual states
        Object.values(playerDice).forEach(dice => {
            dice.classList.remove('active');
        });
    }
    
    function handleRemoteTokenMove(moveData) {
        // Find the token to move
        const playerTokens = tokens[moveData.color];
        const token = playerTokens.find(t => t.id === moveData.tokenId);
        
        if (token) {
            // Update token position
            token.position = moveData.position;
            token.isHome = moveData.isHome;
            
            // Update the board display
            updateBoard();
        }
    }
    
    function handleOfflineGameSelection() {
        // Normal offline game selection
        isOnlineGame = false;
        gameModeSubtitle.textContent = 'Select Number of Players';
        offlinePlayerSelection.style.display = 'block';
        onlineRoomJoin.style.display = 'none';
        playerSelectionModal.style.display = 'flex';
    }
    
    function setupGameEventListeners() {
        // Add event listeners for player number buttons
        playerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                numberOfPlayers = parseInt(btn.dataset.players);
                showColorSelection();
            });
        });
    //     if (token.position === -1 && diceValue === 6) {
    // // Token leaving base
    //         token.position = startPositions[token.color];
        // }
        
        // Add event listener for start game button
        startGameBtn.addEventListener('click', startGame);
        
        // Add event listeners for online room joining
        if (joinRoomGameBtn) {
            joinRoomGameBtn.addEventListener('click', joinOnlineRoom);
        }
        
        if (backToLobbyBtn) {
            backToLobbyBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        // Add event listener for back to login button
        backToLoginBtn.addEventListener('click', () => {
            localStorage.removeItem('playerName');
            localStorage.removeItem('gameMode');
            localStorage.removeItem('roomData');
            window.location.href = 'index.html';
        });
    }
    
    function validateRoomId(roomId) {
        // Simulate room validation (in real app, this would be an API call)
        // For demo purposes, accept rooms that are 6 characters long and alphanumeric
        return roomId && roomId.length === 6 && /^[A-Z0-9]+$/.test(roomId);
    }
    
    function showRoomJoinForm(roomId) {
        document.getElementById('room-join-message').style.display = 'none';
        document.getElementById('room-info').style.display = 'block';
        document.getElementById('room-name-display').textContent = `Game Room`;
        document.getElementById('room-code-display').textContent = roomId;
        
        // Pre-fill name if available
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
            joinPlayerNameInput.value = savedName;
        }
        
        joinPlayerNameInput.focus();
    }
    
    function showRoomError() {
        document.getElementById('room-join-message').style.display = 'none';
        document.getElementById('room-error').style.display = 'block';
    }
    
    function joinOnlineRoom() {
        const playerName = joinPlayerNameInput.value.trim();
        
        if (!playerName) {
            alert('Please enter your name to join the room!');
            joinPlayerNameInput.focus();
            return;
        }
        
        // Store player info
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('gameMode', 'online');
        
        // Simulate joining room
        joinRoomGameBtn.innerHTML = 'Joining...';
        joinRoomGameBtn.disabled = true;
        
        setTimeout(() => {
            // Create mock room data for online game
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('room');
            
            currentRoomData = {
                id: roomId,
                name: 'Friend\'s Room',
                players: [
                    { name: 'Host', color: 'red' },
                    { name: playerName, color: 'green' },
                    { name: 'Player 3', color: 'yellow' },
                    { name: 'Player 4', color: 'blue' }
                ]
            };
            
            // Set up online game
            isOnlineGame = true;
            activePlayers = ['red', 'green', 'yellow', 'blue'];
            numberOfPlayers = 4;
            gameStarted = true;
            
            // Hide modal and start game
            playerSelectionModal.style.display = 'none';
            playerNameDisplay.textContent = playerName;
            
            initGame();
            
            // Show welcome message
            status.textContent = `Welcome ${playerName}! Online game started.`;
        }, 2000);
    }
    
    function showColorSelection() {
        playerColorSelection.style.display = 'block';
        colorOptions.innerHTML = '';
        
        const availableColors = [...allPlayers];
        
        for (let i = 0; i < numberOfPlayers; i++) {
            const playerDiv = document.createElement('div');
            playerDiv.innerHTML = `<h4>Player ${i + 1} - Select Color:</h4>`;
            
            const colorRow = document.createElement('div');
            colorRow.style.marginBottom = '20px';
            
            availableColors.forEach(color => {
                const colorBtn = document.createElement('div');
                colorBtn.className = 'color-option';
                colorBtn.style.backgroundColor = colors[color];
                colorBtn.dataset.color = color;
                colorBtn.dataset.player = i;
                
                colorBtn.addEventListener('click', () => selectColor(colorBtn, i, color));
                colorRow.appendChild(colorBtn);
            });
            
            playerDiv.appendChild(colorRow);
            colorOptions.appendChild(playerDiv);

        }

    }
    // if (tokens.position === -1 && diceValue === 6) {
    // // Token leaving base
    //     tokens.position = startPositions[tokens.color];
    //     }
    // }

    function selectColor(colorBtn, playerIndex, color) {
        // Remove previous selection for this player
        const previousSelection = document.querySelector(`[data-player="${playerIndex}"].selected`);
        if (previousSelection) {
            previousSelection.classList.remove('selected');
            const prevColor = previousSelection.dataset.color;
            // Make the previous color available again
            document.querySelectorAll(`[data-color="${prevColor}"]`).forEach(btn => {
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
            });
        }
        
        // Select new color
        colorBtn.classList.add('selected');
        activePlayers[playerIndex] = color;
        
        // Disable this color for other players
        document.querySelectorAll(`[data-color="${color}"]`).forEach(btn => {
            if (btn !== colorBtn) {
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.5';
            }
        });
        
        // Check if all players have selected colors
        if (activePlayers.filter(p => p).length === numberOfPlayers) {
            startGameBtn.style.display = 'block';
        }
    }
    
    function startGame() {
        // Hide modal
        playerSelectionModal.style.display = 'none';
        gameStarted = true;
    //     if (tokens.position === -1 && diceValue === 6) {
    // // Token leaving base
    //         tokens.position = startPositions[tokens.color];
    //         }
       // }

        // Filter active players and hide inactive dice
        allPlayers.forEach(player => {
            const dice = playerDice[player];
            if (activePlayers.includes(player)) {
                dice.style.display = 'flex';
            } else {
                dice.style.display = 'none';
            }
        });
        
        // Set current player to first active player
        currentPlayerIndex = 0;
        initGame();
    }

    // Path coordinates for placing cells
    const pathCoords = [
        // Red Path
        {r:7,c:2}, {r:7,c:3}, {r:7,c:4}, {r:7,c:5}, {r:7,c:6},
        {r:6,c:7}, {r:5,c:7}, {r:4,c:7}, {r:3,c:7}, {r:2,c:7},
        {r:1,c:7}, {r:1,c:8}, {r:1,c:9},
        // Green Path
        {r:2,c:9}, {r:3,c:9}, {r:4,c:9}, {r:5,c:9}, {r:6,c:9},
        {r:7,c:10}, {r:7,c:11}, {r:7,c:12}, {r:7,c:13}, {r:7,c:14},
        {r:7,c:15}, {r:8,c:15}, {r:9,c:15},
        // Blue Path
        {r:9,c:14}, {r:9,c:13}, {r:9,c:12}, {r:9,c:11}, {r:9,c:10},
        {r:10,c:9}, {r:11,c:9}, {r:12,c:9}, {r:13,c:9}, {r:14,c:9},
        {r:15,c:9}, {r:15,c:8}, {r:15,c:7},
        
        // Yellow Path
        {r:14,c:7}, {r:13,c:7}, {r:12,c:7}, {r:11,c:7}, {r:10,c:7},
        {r:9,c:6}, {r:9,c:5}, {r:9,c:4}, {r:9,c:3}, {r:9,c:2},
        {r:9,c:1}, {r:8,c:1}, {r:7,c:1},
        
    ];

    const homePathCoords = {
        red: [{r:8,c:2}, {r:8,c:3}, {r:8,c:4}, {r:8,c:5}, {r:8,c:6}, {r:8,c:7}],
        green: [{r:2,c:8}, {r:3,c:8}, {r:4,c:8}, {r:5,c:8}, {r:6,c:8}, {r:7,c:8}],
        yellow: [{r:8,c:14}, {r:8,c:13}, {r:8,c:12}, {r:8,c:11}, {r:8,c:10}, {r:8,c:9}],
        blue: [{r:14,c:8}, {r:13,c:8}, {r:12,c:8}, {r:11,c:8}, {r:10,c:8}, {r:9,c:8}]
    };

    const safeSpots = [1, 9, 14, 22, 27, 35, 40, 48];

    function createBoard() {
        // Bases
        board.innerHTML = `
            <div id="red-base" class="base"><div class="home-area"></div></div>
            <div id="green-base" class="base"><div class="home-area"></div></div>
            <div id="yellow-base" class="base"><div class="home-area"></div></div>
            <div id="blue-base" class="base"><div class="home-area"></div></div>
            <div id="home-triangle"><div></div><div></div></div>
        `;

        // Main path
        pathCoords.forEach((coord, i) => {
            const cell = document.createElement('div');
            cell.classList.add('cell', 'path');
            cell.style.gridRow = coord.r;
            cell.style.gridColumn = coord.c;
            cell.dataset.pathIndex = i + 1;
            if (safeSpots.includes(i + 1)) {
                cell.classList.add('safe');
            }
            if (i + 1 === startPositions.red) cell.style.backgroundColor = 'rgba(255, 77, 77, 0.3)';
            if (i + 1 === startPositions.green) cell.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
            if (i + 1 === startPositions.yellow) cell.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
            if (i + 1 === startPositions.blue) cell.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';
            board.appendChild(cell);
        });

        // Home paths
        Object.keys(homePathCoords).forEach(color => {
            homePathCoords[color].forEach((coord, i) => {
                const cell = document.createElement('div');
                cell.classList.add('cell', `${color}-path`);
                cell.style.gridRow = coord.r;
                cell.style.gridColumn = coord.c;
                cell.dataset.homePathIndex = homePaths[color][i];
                board.appendChild(cell);
            });
        });
    }

    function createTokens() {
        tokens = {};
        activePlayers.forEach(player => {
            tokens[player] = [];
            const base = document.querySelector(`#${player}-base .home-area`);
            base.innerHTML = ''; // Clear previous tokens
            for (let i = 0; i < 4; i++) {
                const tokenEl = document.createElement('div');
                tokenEl.classList.add('token', `${player}-token`);
                tokenEl.id = `${player}-token-${i}`;
                
                const tokenObj = {
                    id: i,
                    color: player,
                    position: -1, // -1 means in base
                    element: tokenEl,
                    isHome: false
                };
                tokens[player].push(tokenObj);

                const yardSpot = document.createElement('div');
                yardSpot.classList.add('token-yard');
                yardSpot.appendChild(tokenEl);
                base.appendChild(yardSpot);
                
                tokenEl.addEventListener('click', () => onTokenClick(tokenObj));
            }
        });
    }

    function rollDice() {
        if (diceRolled) return;
        
        const currentPlayer = activePlayers[currentPlayerIndex];
        const currentDice = playerDice[currentPlayer];
        
        if (isOnlineGame) {
            const localPlayerColor = sessionStorage.getItem('localPlayerColor');
            // Only allow dice roll if it's the local player's turn
            if (currentPlayer !== localPlayerColor) {
                return;
            }
        }
        
        if (!currentDice) {
            console.error('Could not find dice element for player:', currentPlayer);
            return;
        }
        
        currentDice.classList.add('rolling');
        
        setTimeout(() => {
            diceValue = Math.floor(Math.random() * 6) + 1;
            currentDice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceValue - 1];
            currentDice.classList.remove('rolling');
            diceRolled = true;
            lastDiceValue = diceValue;
            
            // Send dice roll to multiplayer server if online
            if (isOnlineGame && multiplayerClient && multiplayerClient.isConnected) {
                try {
                    multiplayerClient.sendGameAction('dice_roll', {
                        player: currentPlayer,
                        value: diceValue,
                        playerIndex: currentPlayerIndex
                    });
                } catch (error) {
                    console.error('Failed to send dice roll:', error);
                }
            }
            
            status.textContent = `${playerNames[currentPlayer]} rolled a ${diceValue}`;
            checkMovableTokens();
        }, 500);
    }

    function checkMovableTokens() {
        const currentPlayer = activePlayers[currentPlayerIndex];
        const playerTokens = tokens[currentPlayer];
        let movableTokens = [];

        playerTokens.forEach(token => {
            if (isMovable(token)) {
                token.element.classList.add('movable');
                movableTokens.push(token);
            }
        });

        if (movableTokens.length === 0) {
            // In online games, only advance turn if it's the local player's turn
            if (isOnlineGame) {
                const localPlayerColor = sessionStorage.getItem('localPlayerColor');
                if (currentPlayer === localPlayerColor) {
                    setTimeout(nextTurn, 1000);
                } else {
                }
            } else {
                // Offline game - advance turn normally
                setTimeout(nextTurn, 1000);
            }
        } else if (movableTokens.length === 1) {
            // Automatically move the only available token after a short delay
            // In online games, only auto-move if it's the local player's turn
            if (isOnlineGame) {
                const localPlayerColor = sessionStorage.getItem('localPlayerColor');
                if (currentPlayer === localPlayerColor) {
                    setTimeout(() => {
                        if (movableTokens[0].element.classList.contains('movable')) {
                            moveToken(movableTokens[0]);
                        }
                    }, 1000);
                } else {
                }
            } else {
                // Offline game - auto-move normally
                setTimeout(() => {
                    if (movableTokens[0].element.classList.contains('movable')) {
                        moveToken(movableTokens[0]);
                    }
                }, 1000);
            }
        }
        // If multiple tokens are movable, player needs to choose manually
    }

    // Handle remote dice rolls from other players in online games
    function handleRemoteDiceRoll(data) {
        
        if (!isOnlineGame) {
            return;
        }
        
        const { player, value, playerIndex } = data;
        const localPlayerColor = sessionStorage.getItem('localPlayerColor');

        // Only process if it's not from the local player
        if (player === localPlayerColor) {
            return;
        }
        
        // Update the dice display for the remote player
        const remoteDice = playerDice[player];
        if (remoteDice) {
            remoteDice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1];
            remoteDice.classList.remove('rolling');
        } else {
            console.error('❌ Could not find dice element for remote player:', player);
        }
        
        // Update game state if this matches current turn
        if (activePlayers[currentPlayerIndex] === player) {
            diceValue = value;
            diceRolled = true;
            lastDiceValue = value;
            
            status.textContent = `${playerNames[player]} rolled a ${value}`;
            
            // Check movable tokens for remote player
            setTimeout(() => {
                checkMovableTokens();
            }, 500);
        } else {
        }
    }

    // Handle remote token moves from other players in online games
    function handleRemoteTokenMove(data) {
        
        if (!isOnlineGame) {
            return;
        }
        
        const localPlayerColor = sessionStorage.getItem('localPlayerColor');
        
        // Only process if it's not from the local player
        if (data.color === localPlayerColor) {
            return;
        }

        // Find the token that was moved
        const playerTokens = tokens[data.color];
        if (playerTokens) {
            const movedToken = playerTokens.find(t => t.id === data.tokenId);
            if (movedToken) {
                
                // Update token position
                movedToken.position = data.position;
                movedToken.isHome = data.isHome;
                
                // Update visual position on board
                updateBoard();
                
            } else {
                console.error('❌ Could not find remote token with ID:', data.tokenId);
            }
        } else {
            console.error('❌ Could not find player tokens for color:', data.color);
        }
    }

    // Handle remote turn changes from other players in online games
    function handleRemoteTurnChange(data) {
        
        if (!isOnlineGame) {
            return;
        }
        
        const { currentPlayerIndex: newPlayerIndex, currentPlayer: newPlayer, previousPlayer } = data;
        const localPlayerColor = sessionStorage.getItem('localPlayerColor');

        // Show transition message
        const oldPlayerName = previousPlayer ? (playerNames[previousPlayer] || previousPlayer.charAt(0).toUpperCase() + previousPlayer.slice(1)) : 'Previous Player';
        const newPlayerName = playerNames[newPlayer] || newPlayer.charAt(0).toUpperCase() + newPlayer.slice(1);
        
        status.textContent = `🔄 ${oldPlayerName} → ${newPlayerName}`;
        status.style.color = colors[newPlayer];
        
        // Update the current player index
        if (typeof newPlayerIndex === 'number' && newPlayerIndex >= 0 && newPlayerIndex < activePlayers.length) {
            currentPlayerIndex = newPlayerIndex;
            
            // Small delay before resetting turn to show the transition
            setTimeout(() => {
                resetTurn();
            }, 500);
        } else {
            console.error('❌ Invalid player index in remote turn change:', newPlayerIndex);
        }
    }
    
    function isMovable(token) {
        if (token.isHome) return false;

        if (token.position === -1) { // In base
            return diceValue === 6;
        }
        
        // Check if move is within home path
        const homePathIndex = homePaths[token.color].indexOf(token.position);
        if (homePathIndex !== -1) {
            return homePathIndex + diceValue < homePaths[token.color].length;
        }

        return true;
    }

    function onTokenClick(token) {
        if (token.color !== activePlayers[currentPlayerIndex] || !diceRolled || !token.element.classList.contains('movable')) {
            return;
        }
        
        moveToken(token);
    }

    function moveToken(token) {
        // Clear movable highlights
        document.querySelectorAll('.movable').forEach(el => el.classList.remove('movable'));

        if (token.position === -1 && diceValue === 6) {
            // Token leaving base
            token.position = startPositions[token.color];
        } else if (token.position > 52) {
            // Token already in home path
            const homePathIdx = homePaths[token.color].indexOf(token.position);
            if (homePathIdx !== -1 && homePathIdx + diceValue < homePaths[token.color].length) {
                token.position = homePaths[token.color][homePathIdx + diceValue];
            }
        } else {
            // Token on main board path (positions 1-52)
            const newPosition = token.position + diceValue;
            const homeEntrance = homeEntrances[token.color];
            
            // Check if token has completed a full lap and should enter its home path
            if (token.position <= homeEntrance && newPosition > homeEntrance) {
                // Token is crossing its home entrance - enter home path
                const stepsIntoHome = newPosition - homeEntrance - 1;
                if (stepsIntoHome >= 0 && stepsIntoHome < homePaths[token.color].length) {
                    token.position = homePaths[token.color][stepsIntoHome];
                } else {
                    // If steps exceed home path, place at last home position
                    token.position = homePaths[token.color][homePaths[token.color].length - 1];
                }
            } else {
                // Normal movement on main circular path
                token.position = newPosition > 52 ? ((newPosition - 1) % 52) + 1 : newPosition;
            }
        }
        
        // Check if token reached the final home position
        if (token.position === homePaths[token.color][homePaths[token.color].length - 1]) {
            token.isHome = true;
        }

        updateBoard();
        const captureOccurred = checkCapture(token);
        
        // Send token move to multiplayer server if online
        if (isOnlineGame && multiplayerClient) {
            multiplayerClient.sendGameAction('move_token', {
                tokenId: token.id,
                color: token.color,
                position: token.position,
                isHome: token.isHome
            });
        }
        
        // Player gets another turn if they rolled a 6, captured a token, or reached home
        if (diceValue === 6 || token.isHome || captureOccurred) {
            
            // Show message for bonus turn
            const playerDisplayName = playerNames[token.color] || token.color.charAt(0).toUpperCase() + token.color.slice(1);
            let bonusReason = '';
            if (diceValue === 6) bonusReason = 'rolled a 6';
            else if (token.isHome) bonusReason = 'reached home';
            else if (captureOccurred) bonusReason = 'captured a token';
            
            status.textContent = `🎉 ${playerDisplayName} gets another turn (${bonusReason})!`;
            status.style.color = colors[token.color];
            
            setTimeout(() => {
                resetTurn();
            }, 1500);
        } else {
            // In online games, only the player who moved should advance the turn
            if (isOnlineGame) {
                const localPlayerColor = sessionStorage.getItem('localPlayerColor');
                if (token.color === localPlayerColor) {
                    
                    // Show turn ending message
                    const playerDisplayName = playerNames[token.color] || token.color.charAt(0).toUpperCase() + token.color.slice(1);
                    status.textContent = `✅ ${playerDisplayName}'s turn complete`;
                    status.style.color = colors[token.color];
                    
                    setTimeout(() => {
                        nextTurn();
                    }, 1000);
                } else {
                }
            } else {
                // Offline game - advance turn normally
                
                const playerDisplayName = playerNames[token.color] || token.color.charAt(0).toUpperCase() + token.color.slice(1);
                status.textContent = `✅ ${playerDisplayName}'s turn complete`;
                status.style.color = colors[token.color];
                
                setTimeout(() => {
                    nextTurn();
                }, 1000);
            }
        }
        checkWin();
    }
    
    function updateBoard() {
        activePlayers.forEach(player => {
            tokens[player].forEach(token => {
                let targetCell;
                if (token.position === -1) {
                     targetCell = document.querySelector(`#${player}-token-${token.id}`).parentElement;
                } else if (token.position > 51) { // Home path
                    if (token.isHome) {
                        targetCell = document.querySelector(`#home-triangle`);
                    } else {
                        targetCell = document.querySelector(`[data-home-path-index='${token.position}']`);
                    }
                } else { // Main path
                    targetCell = document.querySelector(`[data-path-index='${token.position}']`);
                }
                if (targetCell) {
                   // Handle multiple tokens on one cell
                    const existingTokens = targetCell.querySelectorAll('.token');
                    if (existingTokens.length > 0 && !safeSpots.includes(token.position)) {
                        let offset = existingTokens.length * 5;
                        token.element.style.transform = `translate(${offset}px, ${offset}px)`;
                    } else {
                        token.element.style.transform = 'translate(0,0)';
                    }
                    targetCell.appendChild(token.element);
                }
            });
        });
    }

    function checkCapture(movedToken) {
        // Don't capture on safe spots, home paths, or in base
        if (movedToken.position === -1 || movedToken.position > 52 || safeSpots.includes(movedToken.position)) {
            return false;
        }

        const targetCell = movedToken.element.parentElement;
        const tokensInCell = Array.from(targetCell.querySelectorAll('.token'));
        let captureOccurred = false;

        tokensInCell.forEach(tokenEl => {
            const capturedToken = findTokenByElement(tokenEl);
            
            // If there's an opponent token in the same cell
            if (capturedToken && capturedToken.color !== movedToken.color && capturedToken.position === movedToken.position) {
                // Add capture animation
                capturedToken.element.classList.add('captured');
                
                // Send captured token back to base after animation
                setTimeout(() => {
                    capturedToken.position = -1; // Back to base
                    capturedToken.element.classList.remove('captured');
                    
                    // Move token back to its base
                    const base = document.querySelector(`#${capturedToken.color}-base .home-area`);
                    const tokenYards = base.querySelectorAll('.token-yard');
                    
                    // Find an empty yard or add to the first one
                    for (let i = 0; i < tokenYards.length; i++) {
                        if (tokenYards[i].children.length === 0 || 
                            Array.from(tokenYards[i].children).some(child => child.id === capturedToken.element.id)) {
                            tokenYards[i].appendChild(capturedToken.element);
                            break;
                        }
                    }
                    
                    // Reset token transform
                    capturedToken.element.style.transform = 'translate(0,0)';
                    
                    updateBoard();
                }, 800); // Wait for capture animation to complete
                
                captureOccurred = true;
                
                // Update status to show capture
                status.textContent = `${movedToken.color} captured ${capturedToken.color} token!`;
            }
        });

        return captureOccurred;
    }
    
    function findTokenByElement(el) {
        for (const player of activePlayers) {
            for (const token of tokens[player]) {
                if (token.element === el) {
                    return token;
                }
            }
        }
        return null;
    }

    function nextTurn() {
        const oldPlayerIndex = currentPlayerIndex;
        const oldPlayer = activePlayers[oldPlayerIndex];
        currentPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
        const newPlayer = activePlayers[currentPlayerIndex];

        // Show transition message
        const oldPlayerName = playerNames[oldPlayer] || oldPlayer.charAt(0).toUpperCase() + oldPlayer.slice(1);
        const newPlayerName = playerNames[newPlayer] || newPlayer.charAt(0).toUpperCase() + newPlayer.slice(1);
        
        // Brief transition message
        status.textContent = `🔄 ${oldPlayerName} → ${newPlayerName}`;
        status.style.color = colors[newPlayer];
        
        // Send turn change to multiplayer server if online
        if (isOnlineGame && multiplayerClient && multiplayerClient.isConnected) {
            try {
                multiplayerClient.sendGameAction('next_turn', { 
                    currentPlayerIndex: currentPlayerIndex,
                    currentPlayer: activePlayers[currentPlayerIndex],
                    previousPlayer: oldPlayer
                });
            } catch (error) {
                console.error('❌ Failed to send turn change:', error);
            }
        } else {
        }
        
        // Small delay before resetting turn to show the transition
        setTimeout(() => {
            resetTurn();
        }, 500);
    }

    function updateStatus() {
        if (!gameStarted || activePlayers.length === 0) return;
        
        const currentPlayer = activePlayers[currentPlayerIndex];
        status.textContent = `${playerNames[currentPlayer]}'s turn`;
        status.style.color = colors[currentPlayer];
    }

    function resetTurn() {
        diceRolled = false;
        diceValue = 0;
        
        const currentPlayer = activePlayers[currentPlayerIndex];
        
        // Clear all movable token highlights first
        document.querySelectorAll('.token').forEach(token => {
            token.classList.remove('movable');
        });
        
        // Reset all dice to inactive state and clear their values
        Object.values(playerDice).forEach(dice => {
            if (dice) {
                dice.classList.remove('active', 'rolling');
                dice.textContent = '🎲';
                dice.style.animation = 'none';
            }
        });
        
        // Activate current player's dice with visual emphasis
        const currentDice = playerDice[currentPlayer];
        if (currentDice) {
            currentDice.classList.add('active');
            // Add a subtle animation to show it's active
            currentDice.style.animation = 'pulse 2s infinite';
        }
        
        // Update status with enhanced messaging
        const playerDisplayName = playerNames[currentPlayer] || currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1);
        status.textContent = `🎲 ${playerDisplayName}'s Turn`;
        status.style.color = colors[currentPlayer];
        
        // For online games, show if it's the local player's turn
        if (isOnlineGame) {
            const localPlayerColor = sessionStorage.getItem('localPlayerColor');
            const isLocalPlayerTurn = currentPlayer === localPlayerColor;
            
            if (isLocalPlayerTurn) {
                status.textContent = `🎲 Your Turn! (${playerDisplayName})`;
                status.style.fontWeight = 'bold';
                // Add visual emphasis for local player turn
                if (currentDice) {
                    currentDice.style.boxShadow = '0 0 15px ' + colors[currentPlayer];
                }
            } else {
                status.textContent = `⏳ ${playerDisplayName}'s Turn`;
                status.style.fontWeight = 'normal';
            }
        } else {
            status.style.fontWeight = 'bold';
        }
    }

    function checkWin() {
        const currentPlayer = activePlayers[currentPlayerIndex];
        const playerTokens = tokens[currentPlayer];
        if (playerTokens.every(t => t.isHome)) {
            winnerMessage.textContent = `${playerNames[currentPlayer]} wins!`;
            winnerMessage.style.color = colors[currentPlayer];
            restartBtn.style.backgroundColor = colors[currentPlayer];
            winnerOverlay.style.display = 'flex';
        }
    }
    
    function initGame() {
        board.innerHTML = '';
        winnerOverlay.style.display = 'none';
        createBoard();
        createTokens();
        currentPlayerIndex = 0;
        resetTurn();
        updateBoard();
    }

    // Add event listeners for all player dice
    Object.entries(playerDice).forEach(([player, dice]) => {
        dice.addEventListener('click', () => {
            if (gameStarted && activePlayers[currentPlayerIndex] === player) {
                // In online games, only allow the current player to roll dice
                if (isOnlineGame) {
                    // Check if this is the local player's turn
                    const localPlayerColor = sessionStorage.getItem('localPlayerColor');
                    if (player === localPlayerColor) {
                        rollDice();
                    }
                } else {
                    // Offline game - allow any player
                    rollDice();
                }
            }
        });
    });
    
    restartBtn.addEventListener('click', () => {
        // Reset game state
        gameStarted = false;
        numberOfPlayers = 0;
        activePlayers = [];
        winnerOverlay.style.display = 'none';
        // Show player selection again (don't go back to login)
        playerSelectionModal.style.display = 'flex';
        
        // Reset player color selection
        playerColorSelection.style.display = 'none';
        colorOptions.innerHTML = '';
        startGameBtn.style.display = 'none';
    });

    // Initialize player selection instead of starting game immediately
    initPlayerSelection();
});

