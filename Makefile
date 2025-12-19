.PHONY: test test-watch test-ui test-coverage test-ci \
        e2e-ci e2e-ci-setup e2e-ci-db-start e2e-ci-db-stop e2e-ci-db-migrate e2e-ci-env e2e-ci-run e2e-ci-clean \
        e2e-local e2e-local-ui e2e-local-demo e2e-local-demo-ui

test:
	npm run test -- --run

test-watch:
	npm run test:watch

test-ui:
	npm run test:ui

test-coverage:
	npm run test -- --run --coverage

test-ci:
	npm run test -- --run --coverage --reporter=verbose

POSTGRES_CONTAINER := domestic-account-booking-e2e-postgres
POSTGRES_PORT := 5433
POSTGRES_USER := postgres
POSTGRES_PASSWORD := postgres
POSTGRES_DB := test_db
DATABASE_URL := postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(POSTGRES_PORT)/$(POSTGRES_DB)

e2e-ci: e2e-ci-setup e2e-ci-run

e2e-ci-setup: e2e-ci-db-start e2e-ci-db-migrate e2e-ci-env
	npx playwright install --with-deps chromium

e2e-ci-db-start:
	@echo "Starting PostgreSQL container..."
	@docker rm -f $(POSTGRES_CONTAINER) 2>/dev/null || true
	@docker run -d \
		--name $(POSTGRES_CONTAINER) \
		-e POSTGRES_USER=$(POSTGRES_USER) \
		-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
		-e POSTGRES_DB=$(POSTGRES_DB) \
		-p $(POSTGRES_PORT):5432 \
		--health-cmd "pg_isready -U $(POSTGRES_USER)" \
		--health-interval 10s \
		--health-timeout 5s \
		--health-retries 5 \
		postgres:15
	@echo "Waiting for PostgreSQL to be ready..."
	@until docker exec $(POSTGRES_CONTAINER) pg_isready -U $(POSTGRES_USER) 2>/dev/null; do \
		sleep 1; \
	done
	@sleep 2
	@echo "PostgreSQL is ready."

e2e-ci-db-migrate:
	@echo "Applying database migrations..."
	@docker cp supabase/migrations/004_nextauth_schema.sql $(POSTGRES_CONTAINER):/tmp/
	@docker cp supabase/migrations/001_initial_schema.sql $(POSTGRES_CONTAINER):/tmp/
	@docker cp supabase/migrations/002_rls_policies.sql $(POSTGRES_CONTAINER):/tmp/
	@docker cp supabase/migrations/003_transactions_table.sql $(POSTGRES_CONTAINER):/tmp/
	@docker exec $(POSTGRES_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f /tmp/004_nextauth_schema.sql
	@docker exec $(POSTGRES_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f /tmp/001_initial_schema.sql
	@docker exec $(POSTGRES_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f /tmp/002_rls_policies.sql
	@docker exec $(POSTGRES_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f /tmp/003_transactions_table.sql
	@echo "Setting up additional schema..."
	@docker exec $(POSTGRES_CONTAINER) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "\
		CREATE SCHEMA IF NOT EXISTS auth; \
		CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"; \
		CREATE TABLE IF NOT EXISTS auth.users ( \
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(), \
			email VARCHAR(255) UNIQUE NOT NULL, \
			password_hash VARCHAR(255) NOT NULL, \
			created_at TIMESTAMP DEFAULT NOW() \
		); \
		CREATE TABLE IF NOT EXISTS users ( \
			id UUID PRIMARY KEY, \
			name VARCHAR(255), \
			email VARCHAR(255) UNIQUE NOT NULL, \
			created_at TIMESTAMP DEFAULT NOW() \
		);"
	@echo "Database migrations applied."

e2e-ci-env:
	@echo "Creating .env.local for E2E tests..."
	@echo "DATABASE_URL=$(DATABASE_URL)" > .env.local.e2e
	@echo "NEXTAUTH_SECRET=test-secret-for-ci-e2e" >> .env.local.e2e
	@echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local.e2e
	@echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.local.e2e
	@echo "E2E_TEST=true" >> .env.local.e2e
	@echo ".env.local.e2e created."

e2e-ci-run:
	@echo "Running E2E tests (CI mode)..."
	CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium-unauth e2e/auth e2e/demo
	CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium e2e/settlement
	CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium e2e/accessibility
	CI=true node --env-file=.env.local.e2e node_modules/.bin/playwright test --project=chromium e2e/security
	@echo "E2E tests completed."

e2e-ci-db-stop:
	@echo "Stopping PostgreSQL container..."
	@docker stop $(POSTGRES_CONTAINER) 2>/dev/null || true
	@docker rm $(POSTGRES_CONTAINER) 2>/dev/null || true
	@echo "PostgreSQL container stopped."

e2e-ci-clean: e2e-ci-db-stop
	@echo "Cleaning up E2E environment..."
	@rm -f .env.local.e2e
	@rm -rf e2e/.auth
	@echo "Cleanup completed."

e2e-local: e2e-ci-setup
	@echo "Running E2E tests (local mode)..."
	node --env-file=.env.local.e2e node_modules/.bin/playwright test

e2e-local-ui: e2e-ci-setup
	@echo "Running E2E tests with UI (local mode)..."
	node --env-file=.env.local.e2e node_modules/.bin/playwright test --ui

e2e-local-demo: e2e-ci-setup
	@echo "Running E2E demo tests (local mode)..."
	node --env-file=.env.local.e2e node_modules/.bin/playwright test e2e/demo

e2e-local-demo-ui: e2e-ci-setup
	@echo "Running E2E demo tests with UI (local mode)..."
	node --env-file=.env.local.e2e node_modules/.bin/playwright test e2e/demo --ui
