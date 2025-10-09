#!/usr/bin/env python3
"""
Simple WebSocket server for Ludo game multiplayer functionality.
This server handles room creation, player joining, and game state synchronization.
"""

import asyncio
import json
import logging
import uuid
import websockets
from datetime import datetime, timedelta
from typing import Dict, Set, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GameRoom:
    def __init__(self, room_id: str, room_name: str, host_name: str, max_players: int = 4, host_phone: str = None):
        self.room_id = room_id
        self.room_name = room_name
        self.host_name = host_name
        self.host_phone = host_phone
        self.max_players = max_players
        self.players = {}  # websocket -> player_info
        self.game_state = {
            'currentPlayer': 0,
            'activePlayers': [],
            'diceValue': 0,
            'gameStarted': False,
            'tokens': {},
            'winner': None
        }
        self.created_at = datetime.now()
    
    def add_player(self, websocket, player_name: str, player_color: str = None):
        if len(self.players) >= self.max_players:
            return False, "Room is full"
        
        if any(p['name'] == player_name for p in self.players.values()):
            return False, "Player name already taken"
        
        player_info = {
            'name': player_name,
            'color': player_color,
            'joined_at': datetime.now().isoformat()
        }
        
        self.players[websocket] = player_info
        logger.info(f"Player {player_name} joined room {self.room_id}")
        return True, "Successfully joined room"
    
    def remove_player(self, websocket):
        if websocket in self.players:
            player_name = self.players[websocket]['name']
            del self.players[websocket]
            logger.info(f"Player {player_name} left room {self.room_id}")
            return True
        return False
    
    def get_player_list(self):
        return [
            {
                'name': info['name'],
                'color': info['color'],
                'status': 'online',  # All connected players are online
                'joined_at': info['joined_at']
            }
            for info in self.players.values()
        ]
    
    def is_empty(self):
        return len(self.players) == 0
    
    def can_start_game(self):
        return len(self.players) >= 2 and not self.game_state['gameStarted']

class LudoGameServer:
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}
        self.connections: Set[websockets.WebSocketServerProtocol] = set()
    
    def generate_room_id(self) -> str:
        """Generate a 6-digit room ID"""
        return str(uuid.uuid4().int)[:6].upper()
    
    async def register_connection(self, websocket):
        self.connections.add(websocket)
        logger.info(f"New connection registered: {websocket.remote_address}")
    
    async def unregister_connection(self, websocket):
        self.connections.discard(websocket)
        
        # Remove player from any room
        for room in self.rooms.values():
            if room.remove_player(websocket):
                await self.broadcast_to_room(room.room_id, {
                    'type': 'player_left',
                    'players': room.get_player_list()
                })
                break
        
        # Clean up empty rooms
        empty_rooms = [room_id for room_id, room in self.rooms.items() if room.is_empty()]
        for room_id in empty_rooms:
            del self.rooms[room_id]
            logger.info(f"Removed empty room: {room_id}")
        
        logger.info(f"Connection unregistered: {websocket.remote_address}")
    
    async def create_room(self, websocket, data):
        room_id = self.generate_room_id()
        room_name = data.get('roomName', f'Room {room_id}')
        host_name = data.get('hostName', 'Host')
        host_phone = data.get('hostPhone', '')
        max_players = data.get('maxPlayers', 4)
        
        room = GameRoom(room_id, room_name, host_name, max_players, host_phone)
        self.rooms[room_id] = room
        
        # Add host to room
        success, message = room.add_player(websocket, host_name)
        
        if success:
            await websocket.send(json.dumps({
                'type': 'room_created',
                'success': True,
                'room_id': room_id,
                'room_name': room_name,
                'host_name': host_name,
                'host_phone': host_phone,
                'max_players': max_players,
                'players': room.get_player_list()
            }))
            logger.info(f"Room created: {room_id} by {host_name}")
        else:
            await websocket.send(json.dumps({
                'type': 'room_created',
                'success': False,
                'error': message
            }))
    
    async def join_room(self, websocket, data):
        room_id = data.get('roomId', '').upper()
        player_name = data.get('playerName', 'Player')
        is_host = data.get('isHost', False)
        
        if room_id not in self.rooms:
            await websocket.send(json.dumps({
                'type': 'join_room',
                'success': False,
                'error': 'Room not found'
            }))
            return
        
        room = self.rooms[room_id]
        
        # Check if player is already in the room (rejoining)
        existing_player = None
        for ws, name in room.players.items():
            if name == player_name:
                existing_player = ws
                break
        
        if existing_player:
            # Player is rejoining - remove old connection and add new one
            logger.info(f"Player {player_name} rejoining room {room_id}")
            room.players.pop(existing_player, None)
            room.players[websocket] = player_name
        else:
            # New player joining
            success, message = room.add_player(websocket, player_name)
            if not success:
                await websocket.send(json.dumps({
                    'type': 'join_room',
                    'success': False,
                    'error': message
                }))
                return
            logger.info(f"Player {player_name} joined room {room_id}")
        
        # Send success response with current room and game state
        response = {
            'type': 'join_room',
            'success': True,
            'room_id': room_id,
            'room_name': room.room_name,
            'player_name': player_name,
            'is_host': is_host,
            'players': room.get_player_list()
        }
        
        # Include current game state if game is active
        if hasattr(room, 'game_state') and room.game_state:
            response['game_state'] = room.game_state
            logger.info(f"Sending current game state to {player_name}: {room.game_state}")
        
        await websocket.send(json.dumps(response))
        
        # Notify other players
        await self.broadcast_to_room(room_id, {
            'type': 'player_joined',
            'player_name': player_name,
            'players': room.get_player_list()
        }, exclude=websocket)
    
    async def start_game(self, websocket, data):
        room_id = data.get('roomId')
        
        if room_id not in self.rooms:
            await websocket.send(json.dumps({
                'type': 'start_game',
                'success': False,
                'error': 'Room not found'
            }))
            return
        
        room = self.rooms[room_id]
        
        if not room.can_start_game():
            await websocket.send(json.dumps({
                'type': 'start_game',
                'success': False,
                'error': 'Need at least 2 players to start'
            }))
            return
        
        # Initialize game state
        room.game_state['gameStarted'] = True
        room.game_state['activePlayers'] = [p['name'] for p in room.get_player_list()]
        room.game_state['currentPlayer'] = 0
        
        await self.broadcast_to_room(room_id, {
            'type': 'game_started',
            'success': True,
            'game_state': room.game_state,
            'players': room.get_player_list()
        })
        
        logger.info(f"Game started in room {room_id}")
    
    async def game_action(self, websocket, data):
        room_id = data.get('roomId')
        action_type = data.get('actionType')
        action_data = data.get('actionData', {})
        
        if room_id not in self.rooms:
            logger.warning(f"Game action for non-existent room: {room_id}")
            return
        
        room = self.rooms[room_id]
        logger.info(f"Game action in room {room_id}: {action_type} - {action_data}")
        
        # Update game state based on action
        if action_type == 'dice_roll':
            room.game_state['diceValue'] = action_data.get('value')
            room.game_state['currentPlayer'] = action_data.get('player')
            room.game_state['currentPlayerIndex'] = action_data.get('playerIndex', 0)
            logger.info(f"Dice roll: Player {action_data.get('player')} rolled {action_data.get('value')}")
        elif action_type == 'move_token':
            # Handle token movement
            logger.info(f"Token move: {action_data}")
        elif action_type == 'next_turn':
            old_player = action_data.get('previousPlayer')
            new_player = action_data.get('currentPlayer')
            new_index = action_data.get('currentPlayerIndex', 0)
            room.game_state['currentPlayer'] = new_player
            room.game_state['currentPlayerIndex'] = new_index
            logger.info(f"Turn change: {old_player} -> {new_player} (index: {new_index})")
        
        # Broadcast game state update to all players in room
        await self.broadcast_to_room(room_id, {
            'type': 'game_update',
            'action_type': action_type,
            'action_data': action_data,
            'game_state': room.game_state
        })
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude=None):
        if room_id not in self.rooms:
            return
        
        room = self.rooms[room_id]
        message_str = json.dumps(message)
        
        # Create a copy of the players dictionary keys to avoid iteration issues
        player_websockets = list(room.players.keys())
        disconnected = []
        
        for websocket in player_websockets:
            if websocket == exclude:
                continue
            
            try:
                await websocket.send(message_str)
            except websockets.exceptions.ConnectionClosed:
                disconnected.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected:
            await self.unregister_connection(websocket)
    
    async def handle_message(self, websocket, message):
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'create_room':
                await self.create_room(websocket, data)
            elif message_type == 'join_room':
                await self.join_room(websocket, data)
            elif message_type == 'start_game':
                await self.start_game(websocket, data)
            elif message_type == 'game_action':
                await self.game_action(websocket, data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
        
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received: {message}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def handle_client(self, websocket):
        await self.register_connection(websocket)
        
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_connection(websocket)

# Initialize server
game_server = LudoGameServer()

async def main():
    logger.info("Starting Ludo Game WebSocket Server on port 8765...")
    
    async def handler(websocket):
        await game_server.handle_client(websocket)
    
    start_server = websockets.serve(
        handler,
        "localhost",
        8765,
        ping_interval=20,
        ping_timeout=10
    )
    
    await start_server
    logger.info("Server started successfully!")
    
    # Keep server running
    await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
