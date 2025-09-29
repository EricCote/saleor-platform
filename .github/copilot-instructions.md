# Saleor Platform Development Guide

## Project Architecture

This is a multi-service Saleor e-commerce platform consisting of:

- **Saleor Core API** (GraphQL backend) - port 8000
- **Next.js Storefront** - ports 3000 (prod) / 3009 (dev)
- **Saleor Dashboard** - port 9000
- **Support services**: PostgreSQL, Redis, Celery worker, Jaeger (APM), Mailpit (email testing)

## Development Workflows

### Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/saleor/saleor-platform.git
cd saleor-platform

# Initialize database and populate with sample data
docker compose run --rm api python3 manage.py migrate
docker compose run --rm api python3 manage.py populatedb --createsuperuser

# Start development environment
docker compose up
```

### Environment Profiles

- `docker compose up` - Backend services only
- `docker compose --profile dev up` - Includes storefront development mode
- `docker compose up storefront_prod` - Production storefront build

### Key Service URLs

- API: http://localhost:8000/graphql/ (GraphQL playground)
- Storefront: http://localhost:3009 (dev) / http://localhost:3000 (prod)
- Dashboard: http://localhost:9000
- Email testing: http://localhost:8025 (Mailpit UI)
- APM: http://localhost:16686 (Jaeger)
- Flower (Celery): http://localhost:5555 (dev profile only)

## Project-Specific Patterns

### GraphQL Development

- **Storefront**: Uses GraphQL Codegen with TypedDocumentString pattern
- **Data import scripts**: Custom GraphQL executor with token refresh in `CreateProducts/graphql.js`
- **Schema location**: `.graphqlrc.ts` configures codegen from `NEXT_PUBLIC_SALEOR_API_URL`
- **Generate types**: Run `pnpm generate` after modifying `.graphql` files in `src/graphql/`

### Data Import Architecture

The `CreateProducts/` and `jolar/CreateProducts/` directories contain specialized data migration tools:

- **Sequential execution**: `init.js` → `categories.js` → `menus.js` → `products.js` → `featured.js`
- **Authentication**: Token-based auth with auto-refresh (see `token.js`)
- **External data**: Connects to NOP Commerce SQL Server via `sqlconn_string` env var
- **Channel setup**: Creates Canadian-specific channels with GST/TVQ tax configuration

### Storefront Conventions

- **App Router**: Uses React Server Components, file-based routing in `src/app/`
- **Component structure**:
  - `src/ui/` - Reusable UI components
  - `src/checkout/` - Self-contained checkout flow (portable)
  - `src/lib/` - Utilities and helpers
- **Package manager**: Uses `pnpm` exclusively (see `packageManager` in package.json)
- **Styling**: TailwindCSS with container queries plugin
- **Testing**: Playwright for E2E tests with custom utilities in `__tests__/utils.ts`

### Environment Configuration

- **Multi-file env**: `common.env` + `backend.env` for backend services
- **Secrets**: Password files in `secrets/` directory (gitignored)
- **Required storefront envs**: `NEXT_PUBLIC_SALEOR_API_URL`, `NEXT_PUBLIC_STOREFRONT_URL`, `SALEOR_APP_TOKEN`

### Development vs Production

- **Storefront development**: Volume mounts with live reload, separate node_modules volume
- **Production build**: Multi-stage Dockerfile with standalone Next.js output
- **Database**: Persistent volumes for data, health checks for service dependencies
- **Networking**: All services on `saleor-backend-tier` bridge network

## Common Issues & Solutions

### Docker Volume Issues

After updates, clean containers: `docker compose stop && docker compose rm && docker compose build`

### Database Reset

**Warning: Data loss!** `docker compose down --volumes db`

### GraphQL Schema Updates

1. Update `.graphql` files in `storefront/src/graphql/`
2. Run `pnpm generate` to regenerate TypeScript types
3. Types are generated in `src/gql/` directory

### Performance Monitoring

- Jaeger traces backend API performance
- Flower monitors Celery task queues
- Use `/api/draft` endpoint for instant content preview

## Testing Strategy

- **E2E Tests**: Playwright tests in `__tests__/` with page object patterns
- **Test utilities**: Reusable functions for cart operations, product selection
- **Test data**: Uses populated sample data from `populatedb` command

When modifying this platform, always consider the multi-service architecture and use the appropriate GraphQL patterns for each service boundary.
