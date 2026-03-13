// Audit logging utilities
import { db } from '@/lib/db';

interface AuditLogParams {
  userId?: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'IMPORT' | 'EXPORT' | 'LOGIN' | 'LOGOUT';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        before: params.before ? JSON.stringify(params.before) : null,
        after: params.after ? JSON.stringify(params.after) : null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

// Helper to serialize entity for audit log
export function serializeForAudit(entity: Record<string, unknown>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(entity)) {
    if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (typeof value === 'object' && value !== null) {
      serialized[key] = JSON.parse(JSON.stringify(value));
    } else {
      serialized[key] = value;
    }
  }
  
  return serialized;
}

// Get audit logs for an entity
export async function getEntityAuditLogs(entityType: string, entityId: string) {
  return db.auditLog.findMany({
    where: { entityType, entityId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
