# CodeZest Auth Service API Documentation

## Overview

The CodeZest Auth Service provides authentication and user management capabilities for the CodeZest platform. It supports JWT-based authentication, OAuth (Google, GitHub), and user profile management.

**Base URL:** `/api/v1`
**Swagger UI:** `/api/docs`

## Authentication

All protected endpoints require a Bearer Token in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

## Endpoints

### 🔐 Authentication

| Method | Path                    | Summary          | Description                                               |
| :----- | :---------------------- | :--------------- | :-------------------------------------------------------- |
| `POST` | `/auth/register`        | Register User    | Creates a new user account.                               |
| `POST` | `/auth/login`           | Login            | Authenticates a user and returns access/refresh tokens.   |
| `POST` | `/auth/refresh`         | Refresh Token    | Generates a new access token using a valid refresh token. |
| `POST` | `/auth/logout`          | Logout           | Invalidates the refresh token.                            |
| `POST` | `/auth/verify-email`    | Verify Email     | Verifies user's email address using a token.              |
| `POST` | `/auth/forgot-password` | Forgot Password  | Sends a password reset link to the user's email.          |
| `POST` | `/auth/reset-password`  | Reset Password   | Resets password using a valid token.                      |
| `POST` | `/auth/change-password` | Change Password  | Changes the password for the authenticated user.          |
| `GET`  | `/auth/me`              | Get Current User | Returns the currently authenticated user's basic info.    |

### 👤 User Management

| Method   | Path                 | Summary            | Description                                           |
| :------- | :------------------- | :----------------- | :---------------------------------------------------- |
| `GET`    | `/users/profile`     | Get Profile        | Retrieves the full profile of the authenticated user. |
| `PUT`    | `/users/profile`     | Update Profile     | Updates profile details (bio, location, etc.).        |
| `PUT`    | `/users/preferences` | Update Preferences | Updates user preferences (theme, notifications).      |
| `DELETE` | `/users/account`     | Delete Account     | Permanently deletes the user's account.               |

### 🌐 OAuth

| Method   | Path                          | Summary              | Description                                        |
| :------- | :---------------------------- | :------------------- | :------------------------------------------------- |
| `GET`    | `/auth/oauth/google`          | Google Login         | Initiates Google OAuth flow.                       |
| `GET`    | `/auth/oauth/google/callback` | Google Callback      | Handles Google OAuth callback.                     |
| `GET`    | `/auth/oauth/github`          | GitHub Login         | Initiates GitHub OAuth flow.                       |
| `GET`    | `/auth/oauth/github/callback` | GitHub Callback      | Handles GitHub OAuth callback.                     |
| `GET`    | `/auth/oauth/linked`          | Get Linked Providers | Lists all OAuth providers linked to the account.   |
| `DELETE` | `/auth/oauth/{provider}`      | Unlink Provider      | Unlinks a specific OAuth provider (google/github). |

## Schemas

### User

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "STUDENT",
  "avatar": "url_to_image"
}
```

### RegisterRequest

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}
```

### LoginRequest

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### AuthResponse

```json
{
  "status": "success",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_token"
    }
  }
}
```

### Tokens

```json
{
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token"
}
```
