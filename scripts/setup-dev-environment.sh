#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install a package using the appropriate package manager
install_package() {
    if command_exists apt-get; then
        sudo apt-get update && sudo apt-get install -y "$1"
    elif command_exists yum; then
        sudo yum install -y "$1"
    elif command_exists brew; then
        brew install "$1"
    else
        echo -e "${RED}Unable to install $1. Please install it manually.${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}Setting up development environment for Supply Chain Verification project...${NC}"

# Check and install Node.js
if ! command_exists node; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    install_package nodejs
fi

# Check and install Docker
if ! command_exists docker; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Check and install Docker Compose
if ! command_exists docker-compose; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Check and install kubectl
if ! command_exists kubectl; then
    echo -e "${YELLOW}Installing kubectl...${NC}"
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
fi

# Check and install Helm
if ! command_exists helm; then
    echo -e "${YELLOW}Installing Helm...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
fi

# Install project dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"
npm install

# Set up environment variables
echo -e "${YELLOW}Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}Please update the .env file with your specific configurations.${NC}"
fi

# Set up Git hooks
echo -e "${YELLOW}Setting up Git hooks...${NC}"
npx husky install

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

# Start development services
echo -e "${YELLOW}Starting development services...${NC}"
docker-compose -f deployment/docker/docker-compose.yml up -d

echo -e "${GREEN}Development environment setup complete!${NC}"
echo -e "${YELLOW}Please run 'source ~/.bashrc' or open a new terminal to apply changes.${NC}"
