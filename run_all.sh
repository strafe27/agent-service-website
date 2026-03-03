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
uv run python packages/website-api-server/server.py &

# 2. Start the Customer Feedback Website
echo "Starting Customer Feedback Website..."
cd packages/customer-feedback-website
npm run dev &
cd ../..

# 3. Start the Agent Admin Website
echo "Starting Company Automation Website..."
cd packages/company-automation-hub-website
npm run dev &
cd ../..

echo "Starting AI Agent ADK API..."
cd packages
adk api_server --port 8000 &
cd ..

echo "All services are starting up!"
echo "- API Server: http://localhost:8081"
echo "- Customer Website: http://localhost:5173 (default vite port)"
echo "- Company Automation Website: http://localhost:5174 (default vite port)"
echo "Press Ctrl+C to stop all services."

# Keep the script running
wait
