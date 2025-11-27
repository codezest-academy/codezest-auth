import { UserRole } from '../../domain/entities';

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponseDto {
  user: UserResponseDto;
  profile: {
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    coverImage: string | null;
    phone: string | null;
    location: string | null;
    timezone: string | null;
    website: string | null;
    educationLevel: string | null;
    fieldOfStudy: string | null;
    institution: string | null;
    graduationYear: number | null;
    occupation: string | null;
    company: string | null;
    yearsOfExperience: number | null;
    skills: any | null;
    learningGoals: any | null;
    interests: any | null;
    socials: any | null;
  };
}
