# Agent Guidelines

## Commands

- Build: `npm run build`
- Lint: `npm run lint` (auto-fixes)
- Format: `npm run format`
- Test (unit): `npm test` or `npm run test:watch`
- Test (single): `npm test -- <filename>` (e.g., `npm test -- movies.service`)
- Test (e2e): `npm run test:e2e`

## Code Style

- **Imports**: NestJS decorators first, then TypeORM, then relative imports (entities, DTOs)
- **Formatting**: Single quotes, trailing commas (enforced by Prettier)
- **Types**: TypeScript strict mode disabled but use explicit types; no `any` warnings acceptable
- **DTOs**: Use `class-validator` decorators and `class-transformer` for validation
- **Error Handling**: Use NestJS exceptions (`NotFoundException`, `UnauthorizedException`, `ForbiddenException`)
- **Naming**: Services use async/await, methods named descriptively (e.g., `findAll`, `create`, `delete`)
- **Entities**: TypeORM entities with decorators, repository pattern for DB access
- **Guards**: Custom guards for auth (JWT) and authorization (roles, subscriptions)
- **Architecture**: NestJS modules with controllers, services, entities, and DTOs separated by feature
