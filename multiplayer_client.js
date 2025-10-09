// WebSocket client for real-time multiplayer functionality
class LudoMultiplayerClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentRoom = null;
        this.playerName = null;
        this.isHost = false;
        this.gameStarted = false;
        
        // Event callbacks
        this.onConnectionChange = null;
        this.onRoomUpdate = null;
        this.onGameUpdate = null;
        this.onError = null;
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket('ws://localhost:8765');
                
                this.socket.onopen = () => {
                    this.isConnected = true;
                    if (this.onConnectionChange) this.onConnectionChange(true);
                    resolve();
                };
                
                this.socket.onclose = () => {
                    this.isConnected = false;
                    if (this.onConnectionChange) this.onConnectionChange(false);
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    if (this.onError) this.onError('Connection failed');
                    reject(error);
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.currentRoom = null;
        this.gameStarted = false;
    }
    
    createRoom(roomName, hostName, maxPlayers = 4, hostPhone = '') {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        this.playerName = hostName;
        this.isHost = true;
        
        this.socket.send(JSON.stringify({
            type: 'create_room',
            roomName: roomName,
            hostName: hostName,
            hostPhone: hostPhone,
            maxPlayers: maxPlayers
        }));
    }
    
    joinRoom(roomId, playerName, isHost = false) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        this.playerName = playerName;
        this.isHost = isHost;
        
        this.socket.send(JSON.stringify({
            type: 'join_room',
            roomId: roomId,
            playerName: playerName,
            isHost: isHost
        }));
    }
    
    startGame() {
        if (!this.isConnected || !this.currentRoom || !this.isHost) {
            throw new Error('Cannot start game');
        }
        
        this.socket.send(JSON.stringify({
            type: 'start_game',
            roomId: this.currentRoom.room_id
        }));
    }
    
    sendGameAction(actionType, actionData) {
        if (!this.isConnected || !this.currentRoom) {
            return;
        }
        
        this.socket.send(JSON.stringify({
            type: 'game_action',
            roomId: this.currentRoom.room_id,
            actionType: actionType,
            actionData: actionData
        }));
    }
    
    handleMessage(data) {
        
        switch (data.type) {
            case 'room_created':
                if (data.success) {
                    this.currentRoom = {
                        room_id: data.room_id,
                        room_name: data.room_name,
                        host_name: data.host_name,
                        players: data.players
                    };
                    if (this.onRoomUpdate) this.onRoomUpdate('created', this.currentRoom);
                } else {
                    if (this.onError) this.onError(data.error);
                }
                break;
                
            case 'join_room':
                if (data.success) {
                    this.currentRoom = {
                        room_id: data.room_id,
                        room_name: data.room_name,
                        players: data.players
                    };
                    
                    // If there's an existing game state, sync it
                    if (data.game_state) {
                        console.log('🔄 Syncing with existing game state:', data.game_state);
                        if (this.onGameUpdate) {
                            this.onGameUpdate('sync', data.game_state, data.players);
                        }
                    }
                    
                    if (this.onRoomUpdate) this.onRoomUpdate('joined', this.currentRoom);
                } else {
                    if (this.onError) this.onError(data.error);
                }
                break;
                
            case 'player_joined':
                if (this.currentRoom) {
                    this.currentRoom.players = data.players;
                    if (this.onRoomUpdate) this.onRoomUpdate('player_joined', this.currentRoom, data.player_name);
                }
                break;
                
            case 'player_left':
                if (this.currentRoom) {
                    this.currentRoom.players = data.players;
                    if (this.onRoomUpdate) this.onRoomUpdate('player_left', this.currentRoom);
                }
                break;
                
            case 'game_started':
                if (data.success) {
                    this.gameStarted = true;
                    if (this.onGameUpdate) this.onGameUpdate('started', data.game_state, data.players);
                } else {
                    if (this.onError) this.onError(data.error);
                }
                break;
                
            case 'game_update':
                if (this.onGameUpdate) {
                    this.onGameUpdate('update', data.game_state, null, data.action_type, data.action_data);
                }
                break;
                
            default:
        }
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.LudoMultiplayerClient = LudoMultiplayerClient;
}
// 