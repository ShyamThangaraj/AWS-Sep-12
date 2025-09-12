#!/bin/bash

# Startup Voice Agent - Start Script
# This script starts both the FastAPI backend and Next.js frontend servers

echo "🚀 Starting Startup Voice Agent..."

# Function to cleanup background processes on script exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend server
echo "📡 Starting FastAPI backend server..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting Next.js frontend server..."
cd frontend

# Check if pnpm is available, otherwise use npm
if command -v pnpm &> /dev/null; then
    echo "📦 Using pnpm to start frontend..."
    pnpm run dev &
else
    echo "📦 Using npm to start frontend..."
    npm run dev &
fi

FRONTEND_PID=$!
cd ..

echo "✅ Both servers are starting up!"
echo "📡 Backend API: http://localhost:8000"
echo "🎨 Frontend: http://localhost:3000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
