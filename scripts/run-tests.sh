#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running tests for Supply Chain Verification project...${NC}"

# Function to run tests with retry logic
run_tests_with_retry() {
    local max_attempts=3
    local attempt=1
    local test_command=$1

    while [ $attempt -le $max_attempts ]; do
        echo -e "${YELLOW}Attempt $attempt of $max_attempts${NC}"
        if $test_command; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 5
    done

    echo -e "${RED}Tests failed after $max_attempts attempts${NC}"
    return 1
}

# Ensure all services are up
echo -e "${YELLOW}Ensuring all services are up...${NC}"
docker-compose -f deployment/docker/docker-compose.yml up -d

# Run linting
echo -e "${YELLOW}Running linting...${NC}"
npm run lint

# Run unit tests
echo -e "${YELLOW}Running unit tests...${NC}"
run_tests_with_retry "npm run test:unit"

# Run integration tests
echo -e "${YELLOW}Running integration tests...${NC}"
run_tests_with_retry "npm run test:integration"

# Run end-to-end tests
echo -e "${YELLOW}Running end-to-end tests...${NC}"
run_tests_with_retry "npm run test:e2e"

# Run blockchain tests
echo -e "${YELLOW}Running blockchain tests...${NC}"
run_tests_with_retry "npm run test:blockchain"

# Generate coverage report
echo -e "${YELLOW}Generating coverage report...${NC}"
npm run coverage

# Check security vulnerabilities
echo -e "${YELLOW}Checking for security vulnerabilities...${NC}"
npm audit

# Run performance tests
echo -e "${YELLOW}Running performance tests...${NC}"
npm run test:performance

# Clean up
echo -e "${YELLOW}Cleaning up...${NC}"
docker-compose -f deployment/docker/docker-compose.yml down

echo -e "${GREEN}All tests completed successfully!${NC}"
