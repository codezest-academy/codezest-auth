import { z } from 'zod';

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
    location: z.string().max(100).optional(),
    website: z.string().url('Invalid website URL').optional(),
    occupation: z.string().max(100).optional(),
    company: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(200).optional(),
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
