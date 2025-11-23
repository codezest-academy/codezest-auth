# Database Schema Changes

These changes need to be applied to the `@codezest-academy/db` package.

## 1. UserRole Enum

Simplify roles to just `USER` and `ADMIN`.

```prisma
enum UserRole {
  USER
  ADMIN
}
```

## 2. UserProfile Model

Add occupation and contact details.

```prisma
model UserProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Existing fields
  bio         String?
  avatar      String?
  location    String?
  website     String?

  // NEW FIELDS
  occupation  String?
  company     String?
  phone       String?
  address     String?
  socials     Json?    // { github: string, linkedin: string, twitter: string, etc. }

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
