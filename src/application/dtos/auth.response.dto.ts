import { UserResponseDto } from './user.response.dto';

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  tokens: AuthTokensDto;
  isNewUser?: boolean;
}
