export type UserRole = 'owner' | 'cook' | 'dietician' | 'viewer';

export interface User {
  id: number;
  login: string;
  global_role: UserRole;
}