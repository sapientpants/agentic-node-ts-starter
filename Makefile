# =============================================================================
# Development Makefile
# Provides short commands for common development tasks
# =============================================================================

.DEFAULT_GOAL := help
.PHONY: help install dev build test clean check verify release

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

## Show this help message
help:
	@echo "$(GREEN)Available commands:$(NC)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development mode (TypeScript watch)"
	@echo "  make test       - Run tests in watch mode"
	@echo "  make build      - Build the project"
	@echo ""
	@echo "$(YELLOW)Quality Assurance:$(NC)"
	@echo "  make check      - Quick quality check (typecheck + lint + test)"
	@echo "  make verify     - Full verification (includes audit + format)"
	@echo "  make lint       - Fix linting issues"
	@echo "  make format     - Fix formatting issues"
	@echo ""
	@echo "$(YELLOW)Testing:$(NC)"
	@echo "  make test-once  - Run tests once"
	@echo "  make coverage   - Run tests with coverage"
	@echo "  make test-ui    - Open Vitest UI"
	@echo ""
	@echo "$(YELLOW)Maintenance:$(NC)"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make reset      - Clean + reinstall dependencies"
	@echo "  make release    - Create a release"
	@echo ""
	@echo "$(YELLOW)For more commands, see package.json scripts$(NC)"

## Install dependencies
install:
	pnpm install

## Start development mode with TypeScript watching
dev:
	pnpm dev

## Run tests in watch mode
test:
	pnpm test:watch

## Run tests once
test-once:
	pnpm test

## Run tests with coverage
coverage:
	pnpm test:coverage

## Open Vitest UI
test-ui:
	pnpm test:ui

## Build the project
build:
	pnpm build

## Quick quality check (faster than verify)
check:
	pnpm quick-check

## Full verification (all quality gates)
verify:
	pnpm verify

## Fix linting issues
lint:
	pnpm lint:fix

## Fix formatting issues
format:
	pnpm format:fix

## Clean build artifacts
clean:
	pnpm clean

## Reset project (clean + reinstall)
reset:
	pnpm reset

## Create a release
release:
	pnpm changeset