#!/usr/bin/env python3
"""
Test script to identify the dice operation issue in online room games
"""
import asyncio
import websockets
import json
import time
from datetime import datetime

class LudoGameTester:
    def __init__(self, player_name, is_host=False):
        self.player_name = player_name
        self.is_host = is_host
        self.websocket = None
        self.room_id = None
        self.connected = False
        self.game_started = False
        self.current_player = None
        self.dice_rolled = False
        
    async def connect(self):
        """Connect to the multiplayer server"""
        try:
            self.websocket = await websockets.connect('ws://localhost:8765')
            self.connected = True
            print(f"[{self.player_name}] Connected to server")
            return True
        except Exception as e:
            print(f"[{self.player_name}] Failed to connect: {e}")
            return False
    
    async def create_room(self):
        """Create a new room (host only)"""
        if not self.is_host:
            return False
            
        message = {
            'type': 'create_room',
            'playerName': self.player_name,
            'maxPlayers': 4
        }
        
        await self.websocket.send(json.dumps(message))
        response = await self.websocket.recv()
        data = json.loads(response)
        
        if data.get('success'):
            self.room_id = data.get('roomId')
            print(f"[{self.player_name}] Created room: {self.room_id}")
            return True
        else:
            print(f"[{self.player_name}] Failed to create room: {data.get('error')}")
            return False
    
    async def join_room(self, room_id):
        """Join an existing room"""
        self.room_id = room_id
        message = {
            'type': 'join_room',
            'roomId': room_id,
            'playerName': self.player_name
        }
        
        await self.websocket.send(json.dumps(message))
        response = await self.websocket.recv()
        data = json.loads(response)
        
        if data.get('success'):
            print(f"[{self.player_name}] Joined room: {room_id}")
            return True
        else:
            print(f"[{self.player_name}] Failed to join room: {data.get('error')}")
            return False
    
    async def start_game(self):
        """Start the game (host only)"""
        if not self.is_host:
            return False
            
        message = {
            'type': 'start_game'
        }
        
        await self.websocket.send(json.dumps(message))
        response = await self.websocket.recv()
        data = json.loads(response)
        
        if data.get('success'):
            print(f"[{self.player_name}] Game started successfully")
            self.game_started = True
            return True
        else:
            print(f"[{self.player_name}] Failed to start game: {data.get('error')}")
            return False
    
    async def roll_dice(self):
        """Roll the dice"""
        if not self.game_started:
            print(f"[{self.player_name}] Game not started yet")
            return False
            
        message = {
            'type': 'game_action',
            'action': 'dice_roll',
            'data': {
                'player': self.current_player,
                'value': 4,  # Fixed value for testing
                'playerIndex': 0
            }
        }
        
        await self.websocket.send(json.dumps(message))
        self.dice_rolled = True
        print(f"[{self.player_name}] Rolled dice")
        return True
    
    async def listen_for_messages(self):
        """Listen for incoming messages"""
        try:
            while self.connected:
                message = await asyncio.wait_for(self.websocket.recv(), timeout=1.0)
                data = json.loads(message)
                await self.handle_message(data)
        except asyncio.TimeoutError:
            pass
        except Exception as e:
            print(f"[{self.player_name}] Error listening for messages: {e}")
            self.connected = False
    
    async def handle_message(self, data):
        """Handle incoming messages"""
        msg_type = data.get('type')
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        
        print(f"[{timestamp}][{self.player_name}] Received: {msg_type}")
        
        if msg_type == 'room_update':
            print(f"[{self.player_name}] Room updated: {data.get('players', [])}")
            
        elif msg_type == 'game_started':
            self.game_started = True
            print(f"[{self.player_name}] Game started! Players: {data.get('activePlayers', [])}")
            
        elif msg_type == 'game_action':
            action = data.get('action')
            action_data = data.get('data', {})
            
            if action == 'dice_roll':
                player = action_data.get('player')
                value = action_data.get('value')
                print(f"[{self.player_name}] 🎲 Player {player} rolled {value}")
                
            elif action == 'next_turn':
                new_player = action_data.get('currentPlayer')
                print(f"[{self.player_name}] 🔄 Turn changed to: {new_player}")
                self.current_player = new_player
                self.dice_rolled = False
                
        else:
            print(f"[{self.player_name}] Unknown message: {data}")
    
    async def disconnect(self):
        """Disconnect from server"""
        self.connected = False
        if self.websocket:
            await self.websocket.close()
            print(f"[{self.player_name}] Disconnected")

async def test_dice_issue():
    """Test the dice operation issue with 2 players"""
    print("🧪 Starting Ludo Room Game Test")
    print("=" * 50)
    
    # Create two players
    host = LudoGameTester("Player1_Host", is_host=True)
    guest = LudoGameTester("Player2_Guest", is_host=False)
    
    try:
        # Step 1: Connect both players
        print("\n📡 Step 1: Connecting players...")
        if not await host.connect():
            return
        if not await guest.connect():
            return
        
        # Step 2: Host creates room
        print("\n🏠 Step 2: Creating room...")
        if not await host.create_room():
            return
        
        room_id = host.room_id
        
        # Step 3: Guest joins room
        print(f"\n👥 Step 3: Guest joining room {room_id}...")
        if not await guest.join_room(room_id):
            return
        
        # Step 4: Start listening for messages
        print("\n👂 Step 4: Starting message listeners...")
        host_task = asyncio.create_task(host.listen_for_messages())
        guest_task = asyncio.create_task(guest.listen_for_messages())
        
        # Wait a bit for room setup
        await asyncio.sleep(2)
        
        # Step 5: Start game
        print("\n🎮 Step 5: Starting game...")
        if not await host.start_game():
            return
        
        # Wait for game start confirmation
        await asyncio.sleep(2)
        
        # Step 6: Test dice rolling for multiple turns
        print("\n🎲 Step 6: Testing dice operation...")
        
        for turn in range(1, 4):  # Test 3 turns
            print(f"\n--- TURN {turn} ---")
            
            # Simulate dice roll from current player
            if turn == 1:
                print("Turn 1: Host rolls dice")
                await host.roll_dice()
            elif turn == 2:
                print("Turn 2: Guest rolls dice")
                await guest.roll_dice()
            else:
                print("Turn 3: Host rolls dice again")
                await host.roll_dice()
            
            # Wait and observe responses
            await asyncio.sleep(3)
            
            # Check if dice operation is still working
            print(f"[ANALYSIS] Turn {turn} completed")
            print(f"  Host game started: {host.game_started}")
            print(f"  Guest game started: {guest.game_started}")
            print(f"  Host current player: {host.current_player}")
            print(f"  Guest current player: {guest.current_player}")
        
        # Step 7: Final analysis
        print("\n📊 Step 7: Final Analysis")
        print("=" * 30)
        
        if not host.game_started or not guest.game_started:
            print("❌ ISSUE FOUND: Game state lost after turn progression")
        
        if host.current_player != guest.current_player:
            print("❌ ISSUE FOUND: Players have different current player state")
        
        print("✅ Test completed successfully")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        
    finally:
        # Cleanup
        print("\n🧹 Cleaning up...")
        await host.disconnect()
        await guest.disconnect()
        
        # Cancel tasks
        if 'host_task' in locals():
            host_task.cancel()
        if 'guest_task' in locals():
            guest_task.cancel()

if __name__ == "__main__":
    print("🎮 Ludo Game Dice Issue Tester")
    print("Testing dice operation after turn progression in online room games")
    asyncio.run(test_dice_issue())
