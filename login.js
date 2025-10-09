// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    const playerNameInput = document.getElementById('playerName');
    const offlineBtn = document.querySelector('.offline-btn');
    const onlineBtn = document.querySelector('.online-btn');
    
    // Online game modals
    const onlineGameModal = document.getElementById('online-game-modal');
    const phoneInviteModal = document.getElementById('phone-invite-modal');
    const roomModal = document.getElementById('room-modal');
    const statusModal = document.getElementById('status-modal');
    
    // Modal close buttons
    const closeOnlineModal = document.getElementById('close-online-modal');
    const closePhoneModal = document.getElementById('close-phone-modal');
    const closeRoomModal = document.getElementById('close-room-modal');
    
    // Online game option buttons
    const inviteByPhoneBtn = document.getElementById('invite-by-phone-btn');
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    
    // Phone invitation elements
    const hostPhoneInput = document.getElementById('hostPhone');
    const friendInputsContainer = document.getElementById('friend-inputs');
    const addFriendBtn = document.getElementById('add-friend-btn');
    const sendInvitesBtn = document.getElementById('send-invites-btn');
    const cancelInviteBtn = document.getElementById('cancel-invite-btn');
    
    // Game data
    let currentRoom = null;
    let invitedFriends = [];
    
    // Initialize multiplayer client
    let multiplayerClient = null;
    
    // Initialize the page
    init();
    
    function init() {
        // Add hover effects to mode cards
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
        
        // Setup event listeners
        setupEventListeners();
        
        // Add animations
        addAnimations();
        
        // Focus on name input when page loads
        setTimeout(() => {
            playerNameInput.focus();
            playerNameInput.select();
        }, 500);
    }
    
    function setupEventListeners() {
        // Main game mode buttons
        offlineBtn.addEventListener('click', handleOfflineGame);
        onlineBtn.addEventListener('click', showOnlineOptions);
        
        // Modal close buttons
        closeOnlineModal.addEventListener('click', () => hideModal(onlineGameModal));
        closePhoneModal.addEventListener('click', () => hideModal(phoneInviteModal));
        closeRoomModal.addEventListener('click', () => hideModal(roomModal));
        
        // Online game options
        inviteByPhoneBtn.addEventListener('click', showPhoneInvitation);
        createRoomBtn.addEventListener('click', showCreateRoom);
        joinRoomBtn.addEventListener('click', showJoinRoom);
        
        // Phone invitation actions
        addFriendBtn.addEventListener('click', addFriendInput);
        sendInvitesBtn.addEventListener('click', sendPhoneInvitations);
        cancelInviteBtn.addEventListener('click', () => hideModal(phoneInviteModal));
        
        // Close modals when clicking outside
        [onlineGameModal, phoneInviteModal, roomModal, statusModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideModal(modal);
                }
            });
        });
        
        // Enter key support for name input
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                offlineBtn.click();
            }
        });
        
        // Dynamic friend input removal
        friendInputsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-friend')) {
                removeFriendInput(e.target.parentElement);
            }
        });
    }
    
    function handleOfflineGame() {
        const playerName = playerNameInput.value.trim();
        
        if (!playerName) {
            alert('Please enter your name before starting the game!');
            playerNameInput.focus();
            return;
        }
        
        // Store player name in localStorage for the game
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('gameMode', 'offline');
        
        // Add loading animation
        offlineBtn.innerHTML = '<span class="loading">🎲 Loading...</span>';
        offlineBtn.style.pointerEvents = 'none';
        
        // Simulate loading and redirect to game
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 1500);
    }
    
    function showOnlineOptions() {
        const playerName = playerNameInput.value.trim();
        
        if (!playerName) {
            alert('Please enter your name!');
            playerNameInput.focus();
            return;
        }
        
        showModal(onlineGameModal);
    }
    
    function showPhoneInvitation() {
        hideModal(onlineGameModal);
        
        // Pre-fill host phone and room name
        const playerName = playerNameInput.value.trim();
        document.getElementById('roomName').value = `${playerName}'s Game Room`;
        
        showModal(phoneInviteModal);
    }
    
    function showCreateRoom() {
        hideModal(onlineGameModal);
        
        const roomContent = document.getElementById('room-content');
        roomContent.innerHTML = `
            <div class="create-room-content">
                <h4>Create a New Game Room</h4>
                <div class="room-settings">
                    <div class="setting-group">
                        <label for="roomNameCreate">Room Name:</label>
                        <input type="text" id="roomNameCreate" value="${playerNameInput.value.trim()}'s Room">
                    </div>
                    <div class="setting-group">
                        <label for="maxPlayers">Maximum Players:</label>
                        <select id="maxPlayers">
                            <option value="2">2 Players</option>
                            <option value="3">3 Players</option>
                            <option value="4" selected>4 Players</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label for="roomPassword">Room Password (Optional):</label>
                        <input type="password" id="roomPassword" placeholder="Leave empty for public room">
                    </div>
                </div>
                <div class="room-actions">
                    <button id="create-room-confirm" class="primary-btn">Create Room</button>
                    <button id="create-room-cancel" class="secondary-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.getElementById('create-room-confirm').addEventListener('click', createGameRoom);
        document.getElementById('create-room-cancel').addEventListener('click', () => hideModal(roomModal));
        
        showModal(roomModal);
    }
    
    function showJoinRoom() {
        hideModal(onlineGameModal);
        
        const roomContent = document.getElementById('room-content');
        roomContent.innerHTML = `
            <div class="join-room-content">
                <h4>Join a Game Room</h4>
                <div class="join-options">
                    <div class="setting-group">
                        <label for="roomCode">Room Code:</label>
                        <input type="text" id="roomCode" placeholder="Enter 6-digit room code" maxlength="6">
                    </div>
                    <div class="setting-group">
                        <label for="joinPassword">Password (if required):</label>
                        <input type="password" id="joinPassword" placeholder="Room password">
                    </div>
                </div>
                <div class="room-actions">
                    <button id="join-room-confirm" class="primary-btn">Join Room</button>
                    <button id="join-room-cancel" class="secondary-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.getElementById('join-room-confirm').addEventListener('click', joinGameRoom);
        document.getElementById('join-room-cancel').addEventListener('click', () => hideModal(roomModal));
        
        showModal(roomModal);
    }
    
    function addFriendInput() {
        const friendInputs = friendInputsContainer.querySelectorAll('.friend-input-group');
        if (friendInputs.length >= 3) {
            alert('You can invite up to 3 friends only!');
            return;
        }
        
        const newFriendGroup = document.createElement('div');
        newFriendGroup.className = 'friend-input-group';
        newFriendGroup.innerHTML = `
            <input type="tel" class="friend-phone" placeholder="+1 (555) 123-4567">
            <input type="text" class="friend-name" placeholder="Friend's Name">
            <button class="remove-friend" type="button">×</button>
        `;
        
        friendInputsContainer.appendChild(newFriendGroup);
        
        // Focus on the new phone input
        newFriendGroup.querySelector('.friend-phone').focus();
    }
    
    function removeFriendInput(friendGroup) {
        const friendInputs = friendInputsContainer.querySelectorAll('.friend-input-group');
        if (friendInputs.length > 1) {
            friendGroup.remove();
        } else {
            alert('You need at least one friend to invite!');
        }
    }
    
    function sendPhoneInvitations() {
        const hostPhone = hostPhoneInput.value.trim();
        const roomName = document.getElementById('roomName').value.trim();
        const gameMode = document.getElementById('gameMode').value;
        
        if (!hostPhone) {
            alert('Please enter your phone number!');
            return;
        }
        
        // Collect friend data
        const friends = [];
        const friendGroups = friendInputsContainer.querySelectorAll('.friend-input-group');
        
        friendGroups.forEach(group => {
            const phone = group.querySelector('.friend-phone').value.trim();
            const name = group.querySelector('.friend-name').value.trim();
            
            if (phone) {
                friends.push({ phone, name: name || 'Friend' });
            }
        });
        
        if (friends.length === 0) {
            alert('Please add at least one friend to invite!');
            return;
        }
        
        // Hide phone modal and show status
        hideModal(phoneInviteModal);
        showInvitationStatus(friends, roomName, gameMode, hostPhone);
    }
    
    function showInvitationStatus(friends, roomName, gameMode, hostPhone) {
        showModal(statusModal);
        
        // Start the invitation process
        document.getElementById('status-text').textContent = 'Creating game room...';
        
        // Simulate room creation
        setTimeout(() => {
            const roomId = generateRoomId();
            currentRoom = {
                id: roomId,
                name: roomName,
                host: playerNameInput.value.trim(),
                hostPhone: hostPhone,
                gameMode: gameMode,
                players: [{ name: playerNameInput.value.trim(), phone: hostPhone, status: 'online' }],
                maxPlayers: friends.length + 1
            };
            
            document.getElementById('status-text').textContent = 'Sending invitations...';
            
            // Simulate sending invitations
            setTimeout(() => {
                showInvitationResults(friends, roomId);
            }, 2000);
        }, 1500);
    }
    
    function showInvitationResults(friends, roomId) {
        document.querySelector('.status-message').style.display = 'none';
        document.getElementById('invitation-results').style.display = 'block';
        
        const resultsList = document.getElementById('results-list');
        resultsList.innerHTML = '';
        
        friends.forEach((friend, index) => {
            setTimeout(() => {
                const resultItem = document.createElement('div');
                resultItem.className = `result-item ${Math.random() > 0.3 ? 'success' : 'error'}`;
                
                const isSuccess = resultItem.classList.contains('success');
                resultItem.innerHTML = `
                    <strong>${friend.name}</strong> (${friend.phone})<br>
                    <span style="color: ${isSuccess ? 'green' : 'red'}">
                        ${isSuccess ? '✅ Invitation sent successfully' : '❌ Failed to send invitation'}
                    </span>
                `;
                
                resultsList.appendChild(resultItem);
                
                if (index === friends.length - 1) {
                    // Show waiting room after all invitations are processed
                    setTimeout(() => {
                        showWaitingRoom(roomId);
                    }, 1000);
                }
            }, index * 500);
        });
    }
    
    function showWaitingRoom(roomId) {
        document.getElementById('invitation-results').style.display = 'none';
        document.getElementById('waiting-room').style.display = 'block';
        document.getElementById('room-id').textContent = roomId;
        
        updatePlayersInRoom();
        setupWaitingRoomActions();
        
        // Room is ready for real players to join
    }
    
    function updatePlayersInRoom() {
        const playersList = document.getElementById('players-in-room');
        playersList.innerHTML = '';
        
        const onlinePlayers = currentRoom.players.filter(p => p.status === 'online');
        
        // Only the original room creator is the host
        const isHost = multiplayerClient && multiplayerClient.isHost;
        
        currentRoom.players.forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${player.name} ${player.phone === currentRoom.hostPhone ? '(Host)' : ''}
                <span class="player-status ${player.status}">${player.status}</span>
            `;
            playersList.appendChild(li);
        });
        
        // Add player count display for host
        const playerCountDiv = document.createElement('div');
        playerCountDiv.className = 'player-count-info';
        playerCountDiv.innerHTML = `
            <div class="count-display">
                <strong>Players: ${onlinePlayers.length}/${currentRoom.maxPlayers || 4}</strong>
                ${isHost ? '<span class="host-badge">You are the Host</span>' : ''}
            </div>
            ${isHost && onlinePlayers.length >= 2 ? '<div class="ready-message">✓ Ready to start game!</div>' : ''}
            ${isHost && onlinePlayers.length < 2 ? '<div class="waiting-message">⏳ Waiting for more players...</div>' : ''}
        `;
        playersList.appendChild(playerCountDiv);
        
        // Enable start button only for host with enough players
        const startBtn = document.getElementById('start-online-game-btn');
        if (startBtn) {
            startBtn.disabled = !isHost || onlinePlayers.length < 2;
            startBtn.style.display = isHost ? 'block' : 'none';
            
            if (isHost) {
                startBtn.textContent = onlinePlayers.length >= 2 ? 
                    `Start Game (${onlinePlayers.length} Players)` : 
                    `Need ${2 - onlinePlayers.length} More Player${2 - onlinePlayers.length === 1 ? '' : 's'}`;
            }
        }
    }
    
    function setupWaitingRoomActions() {
        document.getElementById('start-online-game-btn').addEventListener('click', startOnlineGame);
        document.getElementById('copy-room-link-btn').addEventListener('click', copyRoomLink);
        document.getElementById('close-room-btn').addEventListener('click', closeGameRoom);
    }
    
    async function createGameRoom() {
        const roomName = document.getElementById('roomNameCreate').value.trim();
        const maxPlayers = document.getElementById('maxPlayers').value;
        const password = document.getElementById('roomPassword').value.trim();
        
        if (!roomName) {
            alert('Please enter a room name!');
            return;
        }
        
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert('Please enter your name!');
            return;
        }
        
        // Get host phone from the form
        const hostPhone = hostPhoneInput ? hostPhoneInput.value.trim() : playerName;
        
        hideModal(roomModal);
        showModal(statusModal);
        document.getElementById('status-text').textContent = 'Connecting to server...';
        
        try {
            // Initialize multiplayer client if not already done
            if (!multiplayerClient) {
                multiplayerClient = new LudoMultiplayerClient();
                setupMultiplayerCallbacks();
            }
            
            // Connect to server
            if (!multiplayerClient.isConnected) {
                await multiplayerClient.connect();
            }
            
            document.getElementById('status-text').textContent = 'Creating room...';
            
            // Create room with host phone
            multiplayerClient.createRoom(roomName, playerName, parseInt(maxPlayers), hostPhone);
            
        } catch (error) {
            console.error('Error creating room:', error);
            document.getElementById('status-text').textContent = 'Failed to connect to server. Please try again.';
            setTimeout(() => {
                hideModal(statusModal);
            }, 3000);
        }
    }
    
    async function joinGameRoom() {
        const roomCode = document.getElementById('roomCode').value.trim();
        const password = document.getElementById('joinPassword').value.trim();
        
        if (!roomCode || roomCode.length !== 6) {
            alert('Please enter a valid 6-digit room code!');
            return;
        }
        
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert('Please enter your name!');
            return;
        }
        
        hideModal(roomModal);
        showModal(statusModal);
        document.getElementById('status-text').textContent = 'Connecting to server...';
        
        try {
            // Initialize multiplayer client if not already done
            if (!multiplayerClient) {
                multiplayerClient = new LudoMultiplayerClient();
                setupMultiplayerCallbacks();
            }
            
            // Connect to server
            if (!multiplayerClient.isConnected) {
                await multiplayerClient.connect();
            }
            
            document.getElementById('status-text').textContent = 'Joining room...';
            
            // Join room
            multiplayerClient.joinRoom(roomCode, playerName);
            
        } catch (error) {
            console.error('Error joining room:', error);
            document.getElementById('status-text').textContent = 'Failed to connect to server. Please try again.';
            setTimeout(() => {
                hideModal(statusModal);
            }, 3000);
        }
    }
    
    function setupMultiplayerCallbacks() {
        multiplayerClient.onConnectionChange = (connected) => {
            if (!connected) {
                // Show reconnection message or redirect back to login
            }
        };
        
        multiplayerClient.onRoomUpdate = (eventType, roomData, playerName) => {
            if (eventType === 'created') {
                currentRoom = {
                    id: roomData.room_id,
                    name: roomData.room_name,
                    host: roomData.host_name,
                    hostPhone: roomData.host_phone || playerNameInput.value.trim(),
                    maxPlayers: roomData.max_players || 4,
                    players: roomData.players
                };
                multiplayerClient.isHost = true; // Mark as host since they created the room
                
                // Set local player color based on position in room (host is always first)
                const localPlayerName = playerNameInput.value.trim();
                const playerIndex = roomData.players.findIndex(p => p.name === localPlayerName);
                if (playerIndex !== -1) {
                    const colors = ['red', 'green', 'yellow', 'blue'];
                    const localPlayerColor = colors[playerIndex];
                    sessionStorage.setItem('localPlayerColor', localPlayerColor);
                } else {
                    // Fallback for host (should be first player)
                    sessionStorage.setItem('localPlayerColor', 'red');
                }
                
                document.querySelector('.status-message').style.display = 'none';
                showWaitingRoom(roomData.room_id);
                showNotification(`Room "${currentRoom.name}" created successfully!`);
            } else if (eventType === 'joined') {
                currentRoom = {
                    id: roomData.room_id,
                    name: roomData.room_name,
                    host: roomData.host_name,
                    hostPhone: roomData.host_phone,
                    maxPlayers: roomData.max_players || 4,
                    players: roomData.players
                };
                multiplayerClient.isHost = false; // Not the host since they joined
                
                // Set local player color based on position in room
                const localPlayerName = playerNameInput.value.trim();
                const playerIndex = roomData.players.findIndex(p => p.name === localPlayerName);
                if (playerIndex !== -1) {
                    const colors = ['red', 'green', 'yellow', 'blue'];
                    const localPlayerColor = colors[playerIndex];
                    sessionStorage.setItem('localPlayerColor', localPlayerColor);
                } else {
                    console.warn('⚠️ Could not find local player in room data on join');
                }
                
                document.querySelector('.status-message').style.display = 'none';
                showWaitingRoom(roomData.room_id);
                showNotification(`Joined room "${currentRoom.name}" successfully!`);
            } else if (eventType === 'player_joined') {
                if (currentRoom) {
                    currentRoom.players = roomData.players;
                    
                    // Update local player color in case positions changed
                    const localPlayerName = playerNameInput.value.trim();
                    const playerIndex = roomData.players.findIndex(p => p.name === localPlayerName);
                    if (playerIndex !== -1) {
                        const colors = ['red', 'green', 'yellow', 'blue'];
                        const localPlayerColor = colors[playerIndex];
                        sessionStorage.setItem('localPlayerColor', localPlayerColor);
                    }
                    
                    updatePlayersInRoom();
                    showNotification(`${playerName} joined the room!`);
                }
            } else if (eventType === 'player_left') {
                if (currentRoom) {
                    currentRoom.players = roomData.players;
                    
                    // Update local player color in case positions changed
                    const localPlayerName = playerNameInput.value.trim();
                    const playerIndex = roomData.players.findIndex(p => p.name === localPlayerName);
                    if (playerIndex !== -1) {
                        const colors = ['red', 'green', 'yellow', 'blue'];
                        const localPlayerColor = colors[playerIndex];
                        sessionStorage.setItem('localPlayerColor', localPlayerColor);
                    }
                    
                    updatePlayersInRoom();
                    showNotification(`${playerName || 'A player'} left the room`);
                }
            }
        };
        
        multiplayerClient.onGameUpdate = (eventType, gameState, players, actionType, actionData) => {
            if (eventType === 'started') {
                // Game started, redirect to game page with proper parameters
                localStorage.setItem('playerName', playerNameInput.value.trim());
                localStorage.setItem('gameMode', 'online');
                localStorage.setItem('roomData', JSON.stringify(currentRoom));
                localStorage.setItem('multiplayerMode', 'true');
                
                // Pass room and player data via URL parameters
                const urlParams = new URLSearchParams({
                    roomId: currentRoom.id,
                    mode: 'online',
                    playerName: playerNameInput.value.trim(),
                    isHost: multiplayerClient.isHost ? 'true' : 'false'
                });
                
                window.location.href = `game.html?${urlParams.toString()}`;
            }
        };
        
        multiplayerClient.onError = (error) => {
            console.error('Multiplayer error:', error);
            document.getElementById('status-text').textContent = `Error: ${error}`;
            setTimeout(() => {
                hideModal(statusModal);
            }, 3000);
        };
    }
    
    function showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-family: 'Poppins', sans-serif;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    function startOnlineGame() {
        console.log('Starting online game...', {
            multiplayerClient: !!multiplayerClient,
            isHost: multiplayerClient ? multiplayerClient.isHost : 'no client',
            currentRoom: currentRoom,
            roomPlayers: currentRoom ? currentRoom.players : 'no room'
        });
        
        // Verify host permission - only the original room creator can start
        if (!multiplayerClient || !multiplayerClient.isHost) {
            alert(`Only the host can start the game!\n\nDebug info:\n- Has client: ${!!multiplayerClient}\n- Is host: ${multiplayerClient ? multiplayerClient.isHost : 'no client'}`);
            return;
        }
        
        const onlinePlayers = currentRoom.players.filter(p => p.status === 'online');
        
        if (onlinePlayers.length < 2) {
            alert(`Need at least 2 players to start. Currently have ${onlinePlayers.length} player${onlinePlayers.length === 1 ? '' : 's'}.`);
            return;
        }
        
        // Show confirmation dialog to host
        const confirmStart = confirm(`Start game with ${onlinePlayers.length} players?\n\nPlayers:\n${onlinePlayers.map(p => `• ${p.name}`).join('\n')}`);
        
        if (!confirmStart) {
            return;
        }
        
        if (multiplayerClient && multiplayerClient.isHost) {
            try {
                multiplayerClient.startGame();
                showNotification(`Game starting with ${onlinePlayers.length} players!`);
            } catch (error) {
                console.error('Error starting game:', error);
                alert('Failed to start game. Please try again.');
            }
        } else {
            alert('Connection to server lost. Please refresh and try again.');
        }
    }
    
    function copyRoomLink() {
        // Generate proper room link with current domain
        const currentDomain = window.location.origin;
        const roomLink = `${currentDomain}/game.html?room=${currentRoom.id}`;
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(roomLink).then(() => {
                showNotification('Room link copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy link:', err);
                fallbackCopyToClipboard(roomLink);
            });
        } else {
            // Fallback for older browsers or non-HTTPS
            fallbackCopyToClipboard(roomLink);
        }
    }
    
    function fallbackCopyToClipboard(text) {
        // Create a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // Select and copy the text
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showNotification('Room link copied to clipboard!');
            } else {
                // If copy failed, show the link to user
                showRoomLinkDialog(text);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showRoomLinkDialog(text);
        } finally {
            document.body.removeChild(textArea);
        }
    }
    
    function showRoomLinkDialog(roomLink) {
        // Create a modal to show the room link if copying fails
        const linkModal = document.createElement('div');
        linkModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        linkModal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <h3 style="margin-bottom: 20px;">🔗 Room Link</h3>
                <p style="margin-bottom: 15px;">Copy this link to share with friends:</p>
                <div style="
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 8px;
                    word-break: break-all;
                    font-family: monospace;
                    margin-bottom: 20px;
                    border: 2px solid #ddd;
                ">${roomLink}</div>
                <button id="close-link-modal" style="
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                ">Close</button>
            </div>
        `;
        
        document.body.appendChild(linkModal);
        
        // Close modal when clicking close button or outside
        linkModal.addEventListener('click', (e) => {
            if (e.target === linkModal || e.target.id === 'close-link-modal') {
                document.body.removeChild(linkModal);
            }
        });
        
        // Select the link text for easy copying
        const linkText = linkModal.querySelector('div div');
        const range = document.createRange();
        range.selectNode(linkText);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        showNotification('Room link displayed! Select and copy manually.');
    }
    
    function closeGameRoom() {
        if (confirm('Are you sure you want to close the game room?')) {
            currentRoom = null;
            hideModal(statusModal);
            showNotification('Game room closed.');
        }
    }
    
    function generateRoomId() {
        // Generate a more reliable 6-character room ID
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    function showModal(modal) {
        modal.style.display = 'flex';
        // Add fade-in animation
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }
    
    function hideModal(modal) {
        // Add fade-out animation
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.opacity = '1';
        }, 300);
    }
    
    function showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    function addAnimations() {
        // Add typing animation to creator name
        const creatorName = document.querySelector('.creator-name');
        const originalText = creatorName.textContent;
        creatorName.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                creatorName.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing animation after a short delay
        setTimeout(typeWriter, 1000);
        
        // Add floating animation to game mode icons
        const icons = document.querySelectorAll('.mode-icon');
        icons.forEach((icon, index) => {
            icon.style.animation = `float 3s ease-in-out infinite`;
            icon.style.animationDelay = `${index * 0.5}s`;
        });
        
        // Add CSS for floating animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .loading {
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});
