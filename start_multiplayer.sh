#!/bin/bash

# Setup script for Ludo Multiplayer Game
echo "🎲 Setting up Ludo Multiplayer Game..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 from https://python.org"
    exit 1
fi

# Check if websockets library is installed
if ! python3 -c "import websockets" 2>/dev/null; then
    echo "📦 Installing websockets library..."
    pip3 install websockets
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install websockets. Please run: pip3 install websockets"
        exit 1
    fi
fi

echo "✅ Dependencies installed successfully!"
echo ""
echo "🚀 Starting servers..."

# Start the multiplayer server in background
echo "🔌 Starting WebSocket server on port 8765..."
python3 multiplayer_server.py &
WEBSOCKET_PID=$!

# Wait a moment for server to start
sleep 2

# Start the web server
echo "🌐 Starting web server on port 8000..."
python3 -m http.server 8000 &
HTTP_PID=$!

echo ""
echo "✅ Servers started successfully!"
echo ""
echo "🎮 Game is ready!"
echo "   Web Server: http://localhost:8000"
echo "   WebSocket Server: ws://localhost:8765"
echo ""
echo "📝 Instructions:"
echo "   1. Open http://localhost:8000 in your browser"
echo "   2. Enter your name and click 'Play Online'"
echo "   3. Create or join a room"
echo "   4. Share the room code with friends!"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $WEBSOCKET_PID 2>/dev/null
    kill $HTTP_PID 2>/dev/null
    echo "✅ Servers stopped. Goodbye!"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT

# Wait for servers to run
wait
