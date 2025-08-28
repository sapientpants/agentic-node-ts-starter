#!/usr/bin/env bash

# Container Security Scanning Script
# This script runs the same container security scan locally that runs in CI
# Usage: ./scripts/scan-container.sh [options]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME=""
DOCKERFILE="./Dockerfile"
SEVERITY="HIGH,CRITICAL"
FORMAT="table"
OUTPUT_FILE=""
IGNORE_UNFIXED=false
SKIP_BUILD=false
VERBOSE=false
TRIVY_VERSION="0.57.1"

# Help function
show_help() {
    cat << EOF
Container Security Scanning Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -i, --image NAME        Image name to scan (default: builds from Dockerfile)
    -f, --file PATH         Path to Dockerfile (default: ./Dockerfile)
    -s, --severity LEVEL    Comma-separated severity levels (default: HIGH,CRITICAL)
                           Options: UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL
    -o, --output FILE       Output file for results
    --format FORMAT         Output format: table,json,sarif (default: table)
    --ignore-unfixed        Ignore unpatched/unfixed vulnerabilities
    --skip-build           Skip building the image (requires --image)
    -v, --verbose          Enable verbose output

EXAMPLES:
    # Scan the default Dockerfile
    $0

    # Scan with all severity levels
    $0 --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL

    # Scan an existing image
    $0 --image myapp:latest --skip-build

    # Generate SARIF report for GitHub
    $0 --format sarif --output scan-results.sarif

    # Scan and ignore unfixed vulnerabilities
    $0 --ignore-unfixed

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -i|--image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        -f|--file)
            DOCKERFILE="$2"
            shift 2
            ;;
        -s|--severity)
            SEVERITY="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --ignore-unfixed)
            IGNORE_UNFIXED=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Trivy
install_trivy() {
    echo -e "${YELLOW}Trivy not found. Installing...${NC}"
    
    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case "$ARCH" in
        x86_64|amd64)
            ARCH="64bit"
            ;;
        aarch64|arm64)
            ARCH="ARM64"
            ;;
        *)
            echo -e "${RED}Unsupported architecture: $ARCH${NC}"
            exit 1
            ;;
    esac
    
    case "$OS" in
        linux)
            OS="Linux"
            ;;
        darwin)
            OS="macOS"
            ;;
        *)
            echo -e "${RED}Unsupported OS: $OS${NC}"
            exit 1
            ;;
    esac
    
    # Download URL
    DOWNLOAD_URL="https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_${OS}-${ARCH}.tar.gz"
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    # Download and extract
    echo -e "${BLUE}Downloading Trivy from: $DOWNLOAD_URL${NC}"
    curl -sfL "$DOWNLOAD_URL" | tar -xz -C "$TEMP_DIR"
    
    # Install to /usr/local/bin or local directory
    if [[ -w /usr/local/bin ]]; then
        sudo mv "$TEMP_DIR/trivy" /usr/local/bin/
        echo -e "${GREEN}Trivy installed to /usr/local/bin/trivy${NC}"
    else
        mkdir -p "$HOME/.local/bin"
        mv "$TEMP_DIR/trivy" "$HOME/.local/bin/"
        echo -e "${GREEN}Trivy installed to $HOME/.local/bin/trivy${NC}"
        echo -e "${YELLOW}Please add $HOME/.local/bin to your PATH${NC}"
        export PATH="$HOME/.local/bin:$PATH"
    fi
}

# Check for Docker
if ! command_exists docker; then
    echo -e "${RED}Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Check for Trivy
if ! command_exists trivy; then
    install_trivy
fi

# Verify Trivy installation
if ! command_exists trivy; then
    echo -e "${RED}Failed to install Trivy${NC}"
    exit 1
fi

# Build Docker image if needed
if [[ "$SKIP_BUILD" == "false" ]]; then
    if [[ -z "$IMAGE_NAME" ]]; then
        IMAGE_NAME="security-scan:$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')"
    fi
    
    echo -e "${BLUE}Building Docker image: $IMAGE_NAME${NC}"
    
    if [[ "$VERBOSE" == "true" ]]; then
        docker build -f "$DOCKERFILE" -t "$IMAGE_NAME" .
    else
        docker build -f "$DOCKERFILE" -t "$IMAGE_NAME" . > /dev/null 2>&1
    fi
    
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}Failed to build Docker image${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Successfully built: $IMAGE_NAME${NC}"
else
    if [[ -z "$IMAGE_NAME" ]]; then
        echo -e "${RED}--image is required when using --skip-build${NC}"
        exit 1
    fi
fi

# Prepare Trivy command
TRIVY_CMD="trivy image"

# Add options
if [[ "$IGNORE_UNFIXED" == "true" ]]; then
    TRIVY_CMD="$TRIVY_CMD --ignore-unfixed"
fi

TRIVY_CMD="$TRIVY_CMD --severity $SEVERITY"
TRIVY_CMD="$TRIVY_CMD --format $FORMAT"

if [[ -n "$OUTPUT_FILE" ]]; then
    TRIVY_CMD="$TRIVY_CMD --output $OUTPUT_FILE"
fi

if [[ "$VERBOSE" == "true" ]]; then
    TRIVY_CMD="$TRIVY_CMD --debug"
fi

# Add the image name
TRIVY_CMD="$TRIVY_CMD $IMAGE_NAME"

# Run the scan
echo -e "${BLUE}Running container security scan...${NC}"
echo -e "${BLUE}Command: $TRIVY_CMD${NC}"

# Execute scan and capture result
if eval $TRIVY_CMD; then
    SCAN_RESULT=$?
else
    SCAN_RESULT=$?
fi

# Process results
if [[ $SCAN_RESULT -eq 0 ]]; then
    echo -e "${GREEN}✅ Container security scan passed!${NC}"
    echo -e "${GREEN}No vulnerabilities found matching severity threshold: $SEVERITY${NC}"
else
    echo -e "${RED}❌ Container security scan failed!${NC}"
    echo -e "${RED}Vulnerabilities found matching severity threshold: $SEVERITY${NC}"
    
    # Provide remediation tips
    echo -e "\n${YELLOW}Remediation Tips:${NC}"
    echo -e "1. Update base image to latest version"
    echo -e "2. Update dependencies in package.json"
    echo -e "3. Check for security advisories for your dependencies"
    echo -e "4. Consider using --ignore-unfixed flag for unpatched vulnerabilities"
    echo -e "5. Review detailed results above or in output file"
fi

# If output file was created, notify user
if [[ -n "$OUTPUT_FILE" ]] && [[ -f "$OUTPUT_FILE" ]]; then
    echo -e "\n${BLUE}Scan results saved to: $OUTPUT_FILE${NC}"
fi

exit $SCAN_RESULT