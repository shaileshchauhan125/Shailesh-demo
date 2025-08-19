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
            
            // Auto-start online game with room data
            activePlayers = ['red', 'green', 'yellow', 'blue'].slice(0, currentRoomData.players.length);
            gameStarted = true;
            playerSelectionModal.style.display = 'none';
            initGame();
            return;
        }
        
        // Fallback to offline if no room data
        handleOfflineGameSelection();
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
        
        currentDice.classList.add('rolling');
        
        setTimeout(() => {
            diceValue = Math.floor(Math.random() * 6) + 1;
            currentDice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceValue - 1];
            currentDice.classList.remove('rolling');
            diceRolled = true;
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
            setTimeout(nextTurn, 1000);
        } else if (movableTokens.length === 1) {
            // Automatically move the only available token after a short delay
            setTimeout(() => {
                if (movableTokens[0].element.classList.contains('movable')) {
                    moveToken(movableTokens[0]);
                }
            }, 1000);
        }
        // If multiple tokens are movable, player needs to choose manually
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
        
        // Player gets another turn if they rolled a 6, captured a token, or reached home
        if (diceValue === 6 || token.isHome || captureOccurred) {
            resetTurn();
        } else {
            nextTurn();
        }
        checkWin();
    }
    
    function updateBoard() {
        players.forEach(player => {
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
        for (const player of players) {
            for (const token of tokens[player]) {
                if (token.element === el) {
                    return token;
                }
            }
        }
        return null;
    }

    function nextTurn() {
        currentPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
        resetTurn();
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
        
        // Reset all dice to inactive state
        Object.values(playerDice).forEach(dice => {
            dice.classList.remove('active');
            dice.textContent = '🎲';
        });
        
        // Activate current player's dice
        const currentPlayer = activePlayers[currentPlayerIndex];
        const currentDice = playerDice[currentPlayer];
        currentDice.classList.add('active');
        
        status.textContent = `${playerNames[currentPlayer]}'s turn`;
        status.style.color = colors[currentPlayer];
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
                rollDice();
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
const currentPathIndex = pathCoords.findIndex(p => p.r === token.element.parentElement.style.gridRow.slice(0,-2) && p.c === token.element.parentElement.style.gridColumn.slice(0,-2)) + 1;
if (existingTokens.length > 0 && !safeSpots.includes(token.position)) {
    let offset = existingTokens.length * 5;
    token.element.style.transform = `translate(${offset}px, ${offset}px)`;
} else {
    token.element.style.transform = 'translate(0,0)';
}
const stepsToHomeEntrance = (homeEntrance >= token.position) 
    ? homeEntrance - token.position 
    : (52 - token.position) + homeEntrance;
// ...
if (diceValue > stepsToHomeEntrance + 1) {
    // Move token to home entrance
    token.position = homeEntrance;
}
function moveToken(token) {
    document.querySelectorAll('.movable').forEach(el => el.classList.remove('movable'));

    // Case 1: Token is in the base, needs a 6 to get out
    if (token.position === -1 && diceValue === 6) {
        token.position = startPositions[token.color];
    
    // Case 2: Token is already in its final home path
    } else if (token.position > 51) {
        const homePath = homePaths[token.color];
        const currentHomeIndex = homePath.indexOf(token.position);
        token.position = homePath[currentHomeIndex + diceValue];

    // Case 3: Token is on the main board
    } else {
        const homeEntrance = homeEntrances[token.color];
        // The last square on the main path before the token's home path entrance.
        const lapEndPosition = (homeEntrance - 1 > 0) ? homeEntrance - 1 : 52; 

        // Check if the move will pass or land on the entrance
        let newPos = token.position + diceValue;

        // Logic to handle entering the home path
        if ( (token.position <= lapEndPosition && newPos > lapEndPosition) || 
             (lapEndPosition < token.position && newPos > 52 && (newPos % 52) > lapEndPosition) ) {
            
            const stepsIntoHome = newPos - lapEndPosition - 1;
            token.position = homePaths[token.color][stepsIntoHome];
        } else {
            // Standard move on the circular main path
            token.position = (token.position + diceValue - 1) % 52 + 1;
        }
    }
    
    // Check if token reached the final home spot
    if (token.position === homePaths[token.color][5]) {
        token.isHome = true;
    }

    updateBoard();
    checkCapture(token);
    
    if (diceValue === 6 || token.isHome || captureWasMade) { // Assume checkCapture returns true on a capture
        resetTurn(); // Give player another turn
    } else {
        nextTurn();
    }
    checkWin();
}
