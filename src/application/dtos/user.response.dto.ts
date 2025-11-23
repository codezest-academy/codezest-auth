import { UserRole } from '../../domain/entities';

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponseDto {
  user: UserResponseDto;
  profile: {
    bio: string | null;
    avatar: string | null;
    location: string | null;
    website: string | null;
    occupation: string | null;
    company: string | null;
    phone: string | null;
    address: string | null;
    socials: any | null;
  };
}
