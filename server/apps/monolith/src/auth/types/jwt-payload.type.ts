import { Role } from '../../users/types/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
