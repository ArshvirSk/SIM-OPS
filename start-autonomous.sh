#!/bin/bash

# Start Autonomous System - Unix/Linux/Mac Shell Script
# This script starts both the Next.js dev server and the local scheduler

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "  SIM-OPS Autonomous System Starter"
echo -e "========================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}[WARNING] .env.local not found${NC}"
    echo "Creating from .env.example..."
    cp .env.example .env.local
    echo ""
    echo -e "${YELLOW}[ACTION REQUIRED] Please edit .env.local with your configuration${NC}"
    echo "Then run this script again."
    exit 1
fi

echo -e "${BLUE}[1/3] Checking dependencies...${NC}"
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

echo -e "${BLUE}[2/3] Starting Next.js dev server...${NC}"
# Start Next.js in background
npm run dev > /dev/null 2>&1 &
NEXTJS_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 10

echo -e "${BLUE}[3/3] Starting autonomous scheduler...${NC}"
echo ""
echo -e "${GREEN}========================================"
echo -e "  System is now running autonomously!"
echo -e "========================================${NC}"
echo ""
echo -e "- Next.js: ${CYAN}http://localhost:3000${NC}"
echo -e "- Scheduler: Running in this terminal"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Trap Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping services...'; kill $NEXTJS_PID 2>/dev/null; exit" INT TERM

# Start scheduler (this will block)
node local-scheduler.js

# If scheduler exits, kill Next.js
kill $NEXTJS_PID 2>/dev/null
