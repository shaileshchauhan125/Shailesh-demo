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
        
        // Simulate friends joining
        simulateFriendsJoining();
    }
    
    function updatePlayersInRoom() {
        const playersList = document.getElementById('players-in-room');
        playersList.innerHTML = '';
        
        currentRoom.players.forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${player.name} ${player.phone === currentRoom.hostPhone ? '(Host)' : ''}
                <span class="player-status ${player.status}">${player.status}</span>
            `;
            playersList.appendChild(li);
        });
        
        // Enable start button if enough players
        const startBtn = document.getElementById('start-online-game-btn');
        startBtn.disabled = currentRoom.players.filter(p => p.status === 'online').length < 2;
    }
    
    function setupWaitingRoomActions() {
        document.getElementById('start-online-game-btn').addEventListener('click', startOnlineGame);
        document.getElementById('copy-room-link-btn').addEventListener('click', copyRoomLink);
        document.getElementById('close-room-btn').addEventListener('click', closeGameRoom);
    }
    
    function simulateFriendsJoining() {
        // Simulate friends joining over time
        const joinTimes = [3000, 7000, 12000];
        const friendNames = ['Alex', 'Sarah', 'Mike'];
        
        joinTimes.forEach((time, index) => {
            setTimeout(() => {
                if (currentRoom && index < friendNames.length) {
                    currentRoom.players.push({
                        name: friendNames[index],
                        phone: `+1555000${index + 100}`,
                        status: 'online'
                    });
                    updatePlayersInRoom();
                    
                    // Show notification
                    showNotification(`${friendNames[index]} joined the room!`);
                }
            }, time);
        });
    }
    
    function createGameRoom() {
        const roomName = document.getElementById('roomNameCreate').value.trim();
        const maxPlayers = document.getElementById('maxPlayers').value;
        const password = document.getElementById('roomPassword').value.trim();
        
        if (!roomName) {
            alert('Please enter a room name!');
            return;
        }
        
        hideModal(roomModal);
        showModal(statusModal);
        
        document.getElementById('status-text').textContent = 'Creating room...';
        
        setTimeout(() => {
            const roomId = generateRoomId();
            currentRoom = {
                id: roomId,
                name: roomName,
                host: playerNameInput.value.trim(),
                maxPlayers: parseInt(maxPlayers),
                password: password,
                players: [{ name: playerNameInput.value.trim(), status: 'online' }]
            };
            
            document.querySelector('.status-message').style.display = 'none';
            showWaitingRoom(roomId);
        }, 2000);
    }
    
    function joinGameRoom() {
        const roomCode = document.getElementById('roomCode').value.trim();
        const password = document.getElementById('joinPassword').value.trim();
        
        if (!roomCode || roomCode.length !== 6) {
            alert('Please enter a valid 6-digit room code!');
            return;
        }
        
        hideModal(roomModal);
        showModal(statusModal);
        
        document.getElementById('status-text').textContent = 'Joining room...';
        
        // Simulate joining room
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success rate
            
            if (success) {
                // Simulate successful join
                currentRoom = {
                    id: roomCode,
                    name: 'Friend\'s Game Room',
                    host: 'Friend',
                    players: [
                        { name: 'Friend', status: 'online' },
                        { name: playerNameInput.value.trim(), status: 'online' }
                    ]
                };
                
                document.querySelector('.status-message').style.display = 'none';
                showWaitingRoom(roomCode);
            } else {
                document.getElementById('status-text').textContent = 'Failed to join room. Please check the room code and try again.';
                setTimeout(() => {
                    hideModal(statusModal);
                }, 3000);
            }
        }, 2000);
    }
    
    function startOnlineGame() {
        localStorage.setItem('playerName', playerNameInput.value.trim());
        localStorage.setItem('gameMode', 'online');
        localStorage.setItem('roomData', JSON.stringify(currentRoom));
        
        window.location.href = 'game.html';
    }
    
    function copyRoomLink() {
        // Generate proper room link with current domain
        const currentDomain = window.location.origin;
        const roomLink = `${currentDomain}/game.html?room=${currentRoom.id}`;
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(roomLink).then(() => {
                showNotification('Room link copied to clipboard!');
                console.log('Room link copied:', roomLink);
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
                console.log('Room link copied (fallback):', text);
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
