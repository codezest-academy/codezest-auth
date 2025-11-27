import { z } from 'zod';

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    // User fields
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).optional(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).optional(),
    userName: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      )
      .optional(),
    // Basic profile fields
    displayName: z.string().max(100).optional(),
    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
    coverImage: z.string().url('Invalid cover image URL').optional(),
    phone: z.string().max(20).optional(),
    location: z.string().max(100).optional(),
    timezone: z.string().max(50).optional(),
    website: z.string().url('Invalid website URL').optional(),
    // Education fields
    educationLevel: z.string().max(50).optional(),
    fieldOfStudy: z.string().max(100).optional(),
    institution: z.string().max(200).optional(),
    graduationYear: z.number().int().min(1900).max(2100).optional(),
    // Professional fields
    occupation: z.string().max(100).optional(),
    company: z.string().max(100).optional(),
    yearsOfExperience: z.number().int().min(0).max(100).optional(),
    skills: z.array(z.string()).optional(),
    // Learning & Goals
    learningGoals: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    // Social
    socials: z.record(z.string()).optional(),
  }),
});

// Update preferences schema
export const updatePreferencesSchema = z.object({
  body: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().length(2).optional(), // ISO 639-1 code
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
  }),
});

// Type exports
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>['body'];
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>['body'];
