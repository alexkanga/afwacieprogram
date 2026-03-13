// Auth utilities
import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';
import type { UserRole } from '@prisma/client';
import { ROLE_PERMISSIONS } from '@/config/constants';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS.SUPER_ADMIN): boolean {
  return ROLE_PERMISSIONS[role][permission] as boolean;
}

export function canManageCongress(role: UserRole): boolean {
  return hasPermission(role, 'canManageCongress');
}

export function canManageProgram(role: UserRole): boolean {
  return hasPermission(role, 'canManageProgram');
}

export function canImport(role: UserRole): boolean {
  return hasPermission(role, 'canImport');
}

export function canExport(role: UserRole): boolean {
  return hasPermission(role, 'canExport');
}

export function canPublish(role: UserRole): boolean {
  return hasPermission(role, 'canPublish');
}

export function canDelete(role: UserRole): boolean {
  return hasPermission(role, 'canDelete');
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, 'canManageUsers');
}
