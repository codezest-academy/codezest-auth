# Package Migration Guide: @codezest-academy/db → @codezest-academy/codezest-db

**Date**: November 23, 2025  
**Status**: `@codezest-academy/db` is **DEPRECATED**

---

## Overview

The package has been renamed from `@codezest-academy/db` to `@codezest-academy/codezest-db` for better clarity and consistency with the repository name.

### Package Details

| Old Package               | New Package                     | Status        |
| ------------------------- | ------------------------------- | ------------- |
| `@codezest-academy/db`    | `@codezest-academy/codezest-db` | ✅ Active     |
| Versions: v1.0.0 - v1.0.3 | Current: v1.0.5+                | ⚠️ Deprecated |

---

## Migration Steps

### 1. Update package.json

**Before:**

```json
{
  "dependencies": {
    "@codezest-academy/db": "^1.0.3"
  }
}
```

**After:**

```json
{
  "dependencies": {
    "@codezest-academy/codezest-db": "^1.0.5"
  }
}
```

### 2. Update Import Statements

**No changes needed!** The imports remain the same:

```typescript
// These imports work exactly the same
import { prisma } from "@codezest-academy/codezest-db";
import { User, Role } from "@codezest-academy/codezest-db";
import { mongo } from "@codezest-academy/codezest-db/mongo";
```

### 3. Update .npmrc (if using GitHub Packages)

Ensure your `.npmrc` includes:

```ini
@codezest-academy:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

### 4. Reinstall Dependencies

```bash
# Remove old package
npm uninstall @codezest-academy/db

# Install new package
npm install @codezest-academy/codezest-db

# Or in one command
npm install @codezest-academy/codezest-db && npm uninstall @codezest-academy/db
```

---

## Services to Update

The following services need to be updated:

- [ ] `codezest-auth`
- [ ] `codezest-api`
- [ ] `codezest-payments`
- [ ] `codezest-notifications`
- [ ] `codezest-activity`

---

## What's New in v1.0.5

The new package includes significant improvements:

✅ **Production-Ready Tooling**

- ESLint v9 with TypeScript support
- Prettier for code formatting
- Jest for testing (migrated from Vitest)

✅ **Winston Logger**

- Structured logging in `src/common/logger.ts`
- Production and development modes
- Silent in test environment

✅ **Architecture Documentation**

- Comprehensive architecture guides in `.context/`
- Clean Architecture structure documented
- Naming conventions enforced

✅ **Code Quality**

- 0 lint errors, 0 warnings
- All tests passing
- CI/CD with linting and formatting checks

---

## Automated Migration Script

For bulk updates across multiple services:

```bash
#!/bin/bash
# migrate-db-package.sh

SERVICES=("codezest-auth" "codezest-api" "codezest-payments" "codezest-notifications" "codezest-activity")

for service in "${SERVICES[@]}"; do
  echo "Updating $service..."
  cd "../$service" || continue

  # Update package.json
  npm uninstall @codezest-academy/db
  npm install @codezest-academy/codezest-db

  # Commit changes
  git add package.json package-lock.json
  git commit -m "chore: migrate to @codezest-academy/codezest-db"

  echo "✅ $service updated"
done
```

---

## Troubleshooting

### Issue: Package not found

**Solution**: Ensure you have access to the GitHub Packages registry and your `.npmrc` is configured correctly.

### Issue: Type errors after migration

**Solution**: The package exports are identical. Clear your `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Old package still in package-lock.json

**Solution**: Delete `package-lock.json` and run `npm install` to regenerate it.

---

## Support

For issues or questions, please:

1. Check the [ARCHITECTURE_DESIGN.md](.context/ARCHITECTURE_DESIGN.md)
2. Review the [PROJECT_IMPROVEMENTS.md](.context/PROJECT_IMPROVEMENTS.md)
3. Open an issue in the `codezest-db` repository

---

## Deprecation Notice for Old Package

> [!WARNING] > **`@codezest-academy/db` is deprecated and will not receive updates.**
>
> Please migrate to `@codezest-academy/codezest-db` as soon as possible.
> All new features and bug fixes will only be published to the new package.
