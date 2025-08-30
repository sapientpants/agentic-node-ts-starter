# Customization Guide

How to adapt this template for your specific project needs.

## Initial Setup After Cloning

### 1. Update Package Information

Edit `package.json`:

```json
{
  "name": "your-project-name",
  "version": "0.1.0",
  "description": "Your project description",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/your-repo.git"
  },
  "homepage": "https://github.com/yourusername/your-repo#readme",
  "bugs": {
    "url": "https://github.com/yourusername/your-repo/issues"
  }
}
```

### 2. Clean Up Example Code

```bash
# Remove example source files
rm -rf src/example/

# Remove example tests
rm -rf tests/example/

# Start fresh with your own entry point
echo "console.log('Hello from my project!');" > src/index.ts
```

### 3. Update Documentation

- Replace README.md content with your project's description
- Update or remove CLAUDE.md based on your AI workflow
- Keep docs/ folder for your project documentation

## Customizing Features

### Adjusting TypeScript Configuration

**For less strict typing** (not recommended):

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false, // Disables all strict checks
    "noImplicitAny": false, // Allow implicit any
    "strictNullChecks": false // Disable null checks
  }
}
```

**For different module systems**:

```json
// For CommonJS (if you must)
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node"
  }
}
// Also remove "type": "module" from package.json
```

### Modifying Test Configuration

**Change coverage thresholds**:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 60, // Lower threshold
        branches: 60,
        functions: 60,
        statements: 60,
      },
    },
  },
});
```

**Add test globals** (like Jest):

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true, // Use global describe, it, expect
  },
});
```

### Customizing Linting Rules

**Relax ESLint rules**:

```javascript
// eslint.config.js
export default [
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
```

**Add project-specific rules**:

```javascript
// eslint.config.js
export default [
  ...configs,
  {
    rules: {
      'max-lines': ['error', 300],
      complexity: ['error', 10],
      'no-magic-numbers': ['warn', { ignore: [0, 1] }],
    },
  },
];
```

## Adding Common Features

### Adding a Web Framework

**Express**:

```bash
pnpm add express
pnpm add -D @types/express

# Create server
cat > src/server.ts << 'EOF'
import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
EOF
```

**Fastify**:

```bash
pnpm add fastify

# Create server
cat > src/server.ts << 'EOF'
import fastify from 'fastify';

const app = fastify({ logger: true });

app.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
EOF
```

### Adding Database Support

**PostgreSQL with Prisma**:

```bash
pnpm add prisma @prisma/client
pnpm exec prisma init

# Configure in .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Define schema in prisma/schema.prisma
# Run migrations
pnpm exec prisma migrate dev
```

**MongoDB with Mongoose**:

```bash
pnpm add mongoose

# Create connection
cat > src/database.ts << 'EOF'
import mongoose from 'mongoose';

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp');
}
EOF
```

### Adding Authentication

**JWT Authentication**:

```bash
pnpm add jsonwebtoken bcrypt
pnpm add -D @types/jsonwebtoken @types/bcrypt

# Create auth module
mkdir src/auth
# Implement JWT signing, verification, and password hashing
```

## Removing Features

### Remove Property-Based Testing

```bash
# Uninstall fast-check
pnpm remove @fast-check/vitest

# Remove property test files
rm -rf tests/**/*.property.spec.ts
```

### Remove Commitlint

```bash
# Uninstall commitlint
pnpm remove @commitlint/cli @commitlint/config-conventional

# Remove config
rm commitlint.config.js

# Update .husky/commit-msg
rm .husky/commit-msg
```

### Simplify to JavaScript Only

```bash
# Remove TypeScript
pnpm remove typescript @types/node tsx

# Rename all .ts files to .js
find src tests -name "*.ts" -exec sh -c 'mv "$1" "${1%.ts}.js"' _ {} \;

# Update package.json scripts to use node instead of tsx
# Remove tsconfig.json files
```

## Environment-Specific Configurations

### Development vs Production

**Environment-based configuration**:

```typescript
// src/config.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  // Add your environment variables
});

export const config = EnvSchema.parse(process.env);

// Use throughout your app
if (config.NODE_ENV === 'production') {
  // Production-specific code
}
```

### Docker Support

**Add Dockerfile**:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

# Copy files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY . .
RUN pnpm build

CMD ["node", "dist/index.js"]
```

## CI/CD Customization

### GitHub Actions Modifications

**Add deployment step**:

```yaml
# .github/workflows/main.yml
- name: Deploy to Production
  if: github.ref == 'refs/heads/main'
  run: |
    # Your deployment commands
    echo "Deploying to production"
  env:
    DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

**Change Node/pnpm versions**:

```yaml
# .github/workflows/ci-shared.yml
- uses: actions/setup-node@v4
  with:
    node-version: '20' # Change version

- uses: pnpm/action-setup@v4
  with:
    version: 9 # Change pnpm version
```

## Project-Specific CLAUDE.md

Update CLAUDE.md for your project:

```markdown
# CLAUDE.md

## Project-Specific Context

This is a [your project type] application that [brief description].

## Key Business Rules

1. [Rule 1]
2. [Rule 2]

## Architecture Decisions

- We use [X] for [reason]
- We avoid [Y] because [reason]

## Code Conventions

- [Your specific conventions]
- [Naming patterns]
- [File organization]

## Testing Strategy

- [What should always be tested]
- [What can be skipped]
```

## Maintenance Tips

### Keeping Dependencies Updated

```bash
# Check for updates
pnpm outdated

# Update all dependencies
pnpm update

# Update to latest (major versions)
pnpm update --latest
```

### Syncing with Template Updates

```bash
# Add template as upstream remote
git remote add template https://github.com/original/template.git

# Fetch template changes
git fetch template

# Cherry-pick specific improvements
git cherry-pick <commit-hash>

# Or merge carefully
git merge template/main --allow-unrelated-histories
```

## Common Customization Scenarios

### 1. Microservice Template

- Keep: TypeScript, testing, linting
- Add: Express/Fastify, OpenAPI, health checks
- Remove: Complex build steps

### 2. CLI Tool Template

- Keep: TypeScript, testing
- Add: Commander.js, chalk, ora
- Modify: Build to include shebang, publish to npm

### 3. Library Template

- Keep: Everything
- Add: Multiple build outputs (ESM, CJS, types)
- Modify: package.json exports field

### 4. Full-Stack App Template

- Keep: Backend setup
- Add: Frontend framework, database, auth
- Modify: Separate frontend/backend folders

---

_Remember: This template is a starting point. Feel free to modify anything that doesn't fit your project's needs. The goal is to help you start quickly with good practices, not to constrain your choices._
