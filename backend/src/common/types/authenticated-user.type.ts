import { UserRole } from '../enums';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}
