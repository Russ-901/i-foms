export const roles = {
  ADMIN: 'admin',
  STAFF: 'staff',
};

// Staff positions that are granted the admin role when a User account is
// created for them. Kept in one place so the signup route and the admin
// "create user" route can't disagree with each other.
export const ADMIN_POSITIONS = ['Finance', 'Supervisor', 'Fuel Supervisor'];

export function roleForPosition(position: string): 'admin' | 'staff' {
  return ADMIN_POSITIONS.includes(position) ? 'admin' : 'staff';
}
