# Schema Alignment - Domain Entities vs Prisma

## Issue Summary

During Phase 1 of domain entity integration, we discovered mismatches between the domain entities and the actual Prisma schema from `@codezest-academy/db`.

## Mismatches Found

### 1. EmailVerification Model

**Prisma Schema:**

```prisma
model EmailVerification {
  id         String    @id @default(uuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String    @unique
  verified   Boolean   @default(false)
  verifiedAt DateTime?
  createdAt  DateTime  @default(now())
}
```

**Domain Entity (Current - INCORRECT):**

```typescript
class EmailVerificationToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,  // ❌ DOESN'T EXIST
    public readonly createdAt: Date
  )
}
```

**Issue:** Domain entity expects `expiresAt` but Prisma has `verified` and `verifiedAt` instead.

---

### 2. PasswordReset Model

**Prisma Schema:**

```prisma
model PasswordReset {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String    @unique
  expiresAt DateTime
  used      Boolean   @default(false)
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

**Domain Entity (Current - PARTIALLY CORRECT):**

```typescript
class PasswordResetToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,  // ✅ CORRECT
    public readonly createdAt: Date
  )
}
```

**Issue:** Missing `used` and `usedAt` fields.

---

### 3. User Model

**Prisma Schema:**

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?   // ⚠️ NULLABLE
  name          String
  role          Role      @default(STUDENT)
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
}
```

**Domain Entity (Current):**

```typescript
class User {
  constructor(
    // ...
    private password?: string  // ✅ CORRECT (optional)
  )
}
```

**Issue:** TypeScript complains because Prisma type is `string | null` but domain expects `string | undefined`.

---

## Resolution Strategy

### Option 1: Align Domain Entities with Prisma (RECOMMENDED) ✅

**Approach:** Update domain entities to exactly match Prisma schema.

**Changes Needed:**

1. **EmailVerificationToken** → Rename and restructure

   ```typescript
   class EmailVerification {
     constructor(
       public readonly id: string,
       public readonly userId: string,
       public readonly token: string,
       public readonly verified: boolean,
       public readonly verifiedAt: Date | null,
       public readonly createdAt: Date
     )
   }
   ```

2. **PasswordResetToken** → Add missing fields

   ```typescript
   class PasswordReset {
     constructor(
       public readonly id: string,
       public readonly userId: string,
       public readonly token: string,
       public readonly expiresAt: Date,
       public readonly used: boolean,
       public readonly usedAt: Date | null,
       public readonly createdAt: Date
     )
   }
   ```

3. **User** → Handle nullable password
   ```typescript
   class User {
     constructor(
       // ...
       private password: string | null = null
     )
   }
   ```

**Pros:**

- ✅ Perfect alignment with database
- ✅ No mapping complexity
- ✅ Type-safe
- ✅ Easy to maintain

**Cons:**

- ❌ Domain entities tied to database schema
- ❌ Less flexibility for business logic

---

### Option 2: Keep Domain Entities, Add Complex Mapping

**Approach:** Keep domain entities as designed, handle mismatches in mappers.

**Changes Needed:**

- Add logic in mappers to calculate `expiresAt` from `createdAt`
- Handle `verified`/`verifiedAt` → `expiresAt` conversion
- Add null-to-undefined conversion for password

**Pros:**

- ✅ Domain entities remain pure
- ✅ Business logic separated from database

**Cons:**

- ❌ Complex mapping logic
- ❌ Potential for bugs
- ❌ Performance overhead
- ❌ Harder to maintain

---

## Decision: Option 1 (Align with Prisma)

**Rationale:**

1. **Simplicity** - Direct 1:1 mapping is easier to understand and maintain
2. **Type Safety** - TypeScript will catch mismatches immediately
3. **Performance** - No transformation overhead
4. **Pragmatic** - For a CRUD-heavy auth service, schema alignment makes sense

**Trade-off Accepted:**

- Domain layer will have some coupling to infrastructure (Prisma schema)
- This is acceptable for this use case

---

## Implementation Plan Update

### Phase 1: Update Domain Entities (REVISED)

**Tasks:**

- [x] Create mappers (done)
- [ ] Update `EmailVerification` entity to match Prisma
- [ ] Update `PasswordReset` entity to match Prisma
- [ ] Update `User` entity to handle nullable password
- [ ] Fix mapper implementations
- [ ] Verify build passes

**Estimated Time:** 1-2 hours

---

## Updated Entity Definitions

### EmailVerification.ts (NEW)

```typescript
export class EmailVerification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly verified: boolean,
    public readonly verifiedAt: Date | null,
    public readonly createdAt: Date
  ) {}

  isVerified(): boolean {
    return this.verified;
  }

  verify(): void {
    // Business logic for verification
  }
}
```

### PasswordReset.ts (UPDATED)

```typescript
export class PasswordReset {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly used: boolean,
    public readonly usedAt: Date | null,
    public readonly createdAt: Date
  ) {}

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.used;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }
}
```

---

## Next Steps

1. ✅ Document schema alignment (this file)
2. ⏳ Update domain entities to match Prisma
3. ⏳ Fix mappers
4. ⏳ Verify build
5. ⏳ Continue with Phase 2 (Repository Interfaces)
