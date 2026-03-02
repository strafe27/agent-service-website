#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p)
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "Starting Simple Customer Service Website Services..."

# 1. Start the API Server
echo "Starting Website API Server on port 8081..."
cd packages/website-api-server
python3 server.py &
cd ../..

# 2. Start the Customer Feedback Website
echo "Starting Customer Feedback Website..."
cd packages/customer-feedback-website
npm run dev &
cd ../..

# 3. Start the Agent Admin Website
echo "Starting Agent Admin Website..."
cd packages/agent-admin-website
npm run dev &
cd ../..

echo "All services are starting up!"
echo "- API Server: http://localhost:8081"
echo "- Customer Website: http://localhost:5173 (default vite port)"
echo "- Admin Website: http://localhost:5174 (default vite port)"
echo "Press Ctrl+C to stop all services."

# Keep the script running
wait
