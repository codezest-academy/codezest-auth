# Domain Entities Documentation

## Overview

The `src/domain/entities` folder contains **domain entities** - rich business objects with behavior and validation logic. These entities represent the core business concepts of the authentication system.

## Why Domain Entities?

### Previous State (Empty Folder)

The project was using Prisma-generated types directly:

```typescript
import { User } from '@prisma/client';
// User is just a data structure, no business logic
```

### Current State (Domain Entities)

Now we have rich domain entities with business logic:

```typescript
import { User } from '../domain/entities';
// User has methods like isAdmin(), isEmailVerified(), etc.
```

## Benefits

1. **Business Logic Encapsulation** - Logic lives with the data
2. **Type Safety** - Strong typing with TypeScript classes
3. **Reusability** - Use entities across services
4. **Testability** - Easy to unit test entity methods
5. **Clean Architecture** - Domain layer is independent

## Entities

### 1. User Entity (`User.ts`)

Represents a user in the system with authentication and authorization logic.

**Properties:**

- `id`: Unique identifier
- `email`: User email address
- `name`: User display name
- `role`: User role (STUDENT, INSTRUCTOR, ADMIN)
- `emailVerified`: Email verification status
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp
- `password`: Hashed password (private)

**Methods:**

```typescript
// Role checks
user.hasRole('ADMIN'); // Check specific role
user.isAdmin(); // Check if admin
user.isStudent(); // Check if student
user.isInstructor(); // Check if instructor

// Email verification
user.isEmailVerified(); // Check if email verified

// Data sanitization
user.toPublic(); // Remove sensitive data

// Static validators
User.isValidEmail(email); // Validate email format
User.isValidPassword(pass); // Validate password strength
```

**Usage Example:**

```typescript
const user = new User(
  '123',
  'john@example.com',
  'John Doe',
  'STUDENT',
  true,
  new Date(),
  new Date()
);

if (user.isAdmin()) {
  // Grant admin access
}

if (!user.isEmailVerified()) {
  // Send verification email
}

const publicUser = user.toPublic(); // Safe to send to client
```

---

### 2. Session Entity (`Session.ts`)

Represents a user session with expiration and validation logic.

**Properties:**

- `id`: Unique identifier
- `userId`: Associated user ID
- `token`: Refresh token
- `expiresAt`: Expiration timestamp
- `createdAt`: Creation timestamp

**Methods:**

```typescript
session.isExpired(); // Check if expired
session.isValid(); // Check if valid (not expired)
session.getRemainingTime(); // Get time until expiration (ms)
session.expiresSoon(); // Check if expires within 1 hour
session.getAge(); // Get session age (ms)
```

**Usage Example:**

```typescript
const session = new Session(
  '456',
  '123',
  'refresh-token-xyz',
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  new Date()
);

if (session.isExpired()) {
  throw new UnauthorizedError('Session expired');
}

if (session.expiresSoon()) {
  // Consider refreshing the session
}

const remainingMs = session.getRemainingTime();
console.log(`Session expires in ${remainingMs / 1000 / 60} minutes`);
```

---

### 3. Token Entities (`Token.ts`)

#### EmailVerificationToken

Represents an email verification token with expiration logic.

**Properties:**

- `id`: Unique identifier
- `userId`: Associated user ID
- `token`: Verification token
- `expiresAt`: Expiration timestamp
- `createdAt`: Creation timestamp

**Methods:**

```typescript
token.isExpired(); // Check if expired
token.isValid(); // Check if valid
token.getRemainingTime(); // Get time until expiration (ms)
```

#### PasswordResetToken

Represents a password reset token with expiration and rate limiting logic.

**Properties:**

- Same as EmailVerificationToken

**Methods:**

```typescript
token.isExpired(); // Check if expired
token.isValid(); // Check if valid
token.getRemainingTime(); // Get time until expiration (ms)
token.isRecentlyCreated(); // Check if created within 5 minutes
```

**Usage Example:**

```typescript
const resetToken = new PasswordResetToken(
  '789',
  '123',
  'reset-token-abc',
  new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  new Date()
);

if (resetToken.isExpired()) {
  throw new BadRequestError('Token expired');
}

if (resetToken.isRecentlyCreated()) {
  // Rate limit: Don't allow multiple reset requests
  throw new BadRequestError('Please wait before requesting another reset');
}
```

---

## Integration with Repositories

Domain entities are created from Prisma types in repositories:

```typescript
// In UserRepository
async findById(id: string): Promise<User | null> {
  const prismaUser = await this.prisma.user.findUnique({ where: { id } });

  if (!prismaUser) return null;

  // Map Prisma type to Domain Entity
  return new User(
    prismaUser.id,
    prismaUser.email,
    prismaUser.name,
    prismaUser.role as UserRole,
    prismaUser.emailVerified,
    prismaUser.createdAt,
    prismaUser.updatedAt,
    prismaUser.password
  );
}
```

## Best Practices

1. **Keep Entities Pure** - No external dependencies (no database, no HTTP)
2. **Business Logic Only** - Only domain-related logic
3. **Immutability** - Use `readonly` for properties
4. **Validation** - Add static validation methods
5. **No Setters** - Create new instances instead of mutating

## When to Add New Entities

Add a new entity when:

- ✅ You have business logic related to the data
- ✅ You need validation rules
- ✅ You want to encapsulate behavior
- ✅ The concept is core to your domain

Don't create entities for:

- ❌ Simple DTOs (use Zod schemas)
- ❌ Database-specific types
- ❌ API request/response objects

## Testing Entities

Entities are easy to unit test:

```typescript
describe('User Entity', () => {
  it('should identify admin users', () => {
    const admin = new User('1', 'admin@test.com', 'Admin', 'ADMIN', true, new Date(), new Date());
    expect(admin.isAdmin()).toBe(true);
    expect(admin.isStudent()).toBe(false);
  });

  it('should validate email format', () => {
    expect(User.isValidEmail('valid@email.com')).toBe(true);
    expect(User.isValidEmail('invalid')).toBe(false);
  });
});
```

## Future Enhancements

Consider adding:

- `UserProfile` entity for profile-specific logic
- `OAuthAccount` entity for OAuth integration
- `RefreshToken` entity separate from Session
- `AuditLog` entity for tracking changes
