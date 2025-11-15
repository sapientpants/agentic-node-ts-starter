#!/usr/bin/env bash
#
# Secret scanning with gitleaks
# Scans git history and current files for secrets and credentials
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gitleaks is installed
if ! command -v gitleaks &> /dev/null; then
  echo -e "${RED}Error: gitleaks is not installed${NC}"
  echo ""
  echo "Install gitleaks:"
  echo "  macOS:   brew install gitleaks"
  echo "  Linux:   See https://github.com/gitleaks/gitleaks#installation"
  echo "  Docker:  docker pull zricethezav/gitleaks"
  echo ""
  echo "Or run in CI with GitHub Actions (configured in .github/workflows)"
  exit 1
fi

# Default mode is to scan
MODE="${1:-scan}"

case "$MODE" in
  scan)
    echo -e "${GREEN}Scanning repository for secrets...${NC}"
    gitleaks detect --config .gitleaks.toml --verbose
    ;;
  protect)
    echo -e "${GREEN}Scanning staged changes for secrets...${NC}"
    gitleaks protect --config .gitleaks.toml --staged --verbose
    ;;
  history)
    echo -e "${YELLOW}Scanning full git history for secrets...${NC}"
    echo -e "${YELLOW}This may take a while for large repositories${NC}"
    gitleaks detect --config .gitleaks.toml --log-opts="--all" --verbose
    ;;
  report)
    echo -e "${GREEN}Generating secret scan report...${NC}"
    mkdir -p reports
    gitleaks detect --config .gitleaks.toml --report-format json --report-path reports/gitleaks-report.json --verbose
    echo -e "${GREEN}Report saved to reports/gitleaks-report.json${NC}"
    ;;
  *)
    echo "Usage: $0 {scan|protect|history|report}"
    echo ""
    echo "Modes:"
    echo "  scan     - Scan current repository state (default)"
    echo "  protect  - Scan staged changes only (pre-commit)"
    echo "  history  - Scan full git history"
    echo "  report   - Generate JSON report"
    exit 1
    ;;
esac

echo -e "${GREEN}✓ Secret scan complete${NC}"
