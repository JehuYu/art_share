#!/bin/bash
# ============================================
# Art Share - Deployment Script
# ============================================
# This script helps deploy Art Share to a server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Art Share Deployment Script${NC}"
echo -e "${GREEN}============================================${NC}"

# Check if AUTH_SECRET is set
if [ -z "$AUTH_SECRET" ]; then
    echo -e "${YELLOW}Warning: AUTH_SECRET not set. Generating a random one...${NC}"
    export AUTH_SECRET=$(openssl rand -base64 32)
    echo -e "${GREEN}Generated AUTH_SECRET: $AUTH_SECRET${NC}"
    echo -e "${YELLOW}Please save this secret for future deployments!${NC}"
fi

# Function to build the Docker image
build_image() {
    echo -e "${GREEN}Building Docker image...${NC}"
    docker build -t art_share:latest .
    echo -e "${GREEN}Image built successfully!${NC}"
}

# Function to start the application
start_app() {
    echo -e "${GREEN}Starting Art Share...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
    echo -e "${GREEN}Art Share is starting...${NC}"
    echo -e "${GREEN}Please wait a few seconds and check: http://localhost:3000${NC}"
}

# Function to stop the application
stop_app() {
    echo -e "${YELLOW}Stopping Art Share...${NC}"
    docker-compose -f docker-compose.prod.yml down
    echo -e "${GREEN}Art Share stopped.${NC}"
}

# Function to view logs
view_logs() {
    docker-compose -f docker-compose.prod.yml logs -f
}

# Function to check health
check_health() {
    echo -e "${GREEN}Checking application health...${NC}"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
}

# Function to backup data
backup_data() {
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    echo -e "${GREEN}Backing up data to $BACKUP_DIR...${NC}"
    docker cp art_share:/app/prisma/dev.db "$BACKUP_DIR/dev.db" 2>/dev/null || echo "No database to backup"
    docker cp art_share:/app/public/uploads "$BACKUP_DIR/uploads" 2>/dev/null || echo "No uploads to backup"
    echo -e "${GREEN}Backup completed!${NC}"
}

# Main menu
case "$1" in
    build)
        build_image
        ;;
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        start_app
        ;;
    logs)
        view_logs
        ;;
    health)
        check_health
        ;;
    backup)
        backup_data
        ;;
    deploy)
        build_image
        stop_app
        start_app
        ;;
    *)
        echo "Usage: $0 {build|start|stop|restart|logs|health|backup|deploy}"
        echo ""
        echo "Commands:"
        echo "  build   - Build Docker image"
        echo "  start   - Start the application"
        echo "  stop    - Stop the application"
        echo "  restart - Restart the application"
        echo "  logs    - View application logs"
        echo "  health  - Check application health"
        echo "  backup  - Backup database and uploads"
        echo "  deploy  - Build and restart (full deployment)"
        exit 1
        ;;
esac
