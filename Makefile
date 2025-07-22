.PHONY: ci install dev build test test-coverage lint format check clean

# CI pipeline
ci:
	npm ci
	npm run lint
	npm run format:check
	npm run check
	npm run test:run
	npm run build
	@echo "✅ CI pipeline completed successfully"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install
	cd src-tauri && cargo check

# Development server
dev:
	@echo "🚀 Starting development server..."
	npm run tauri:dev

# Build application
build:
	@echo "🔨 Building application..."
	npm run build
	npm run tauri:build

# Run tests
test:
	@echo "🧪 Running tests..."
	npm run test:run

# Run tests with coverage
test-coverage:
	@echo "📊 Running tests with coverage..."
	npm run test:coverage

# Lint code
lint:
	@echo "🔍 Linting code..."
	npm run lint
	@echo "✅ Linting completed"

# Fix linting issues
lint-fix:
	@echo "🔧 Fixing linting issues..."
	npm run lint:fix
	@echo "✅ Linting fixes applied"

# Format code
format:
	@echo "🎨 Formatting code..."
	npm run format
	@echo "✅ Formatting completed"

# Check formatting
format-check:
	@echo "🔍 Checking code formatting..."
	npm run format:check
	@echo "✅ Format check completed"

# Type checking
check:
	@echo "🔎 Type checking..."
	npm run check
	cd src-tauri && cargo check

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist
	rm -rf .svelte-kit
	rm -rf node_modules/.vite
	cd src-tauri && cargo clean

# Run specific test file
test-address-bar:
	@echo "🎯 Testing AddressBar component..."
	npm run test -- src/lib/components/AddressBar.test.ts

# Development with tests watching
dev-test:
	@echo "🔄 Starting development with test watching..."
	npm run test &
	npm run dev