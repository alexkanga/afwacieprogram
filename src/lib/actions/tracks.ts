'use server';

// Session Types and Tracks CRUD operations
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser, canManageProgram } from '@/lib/auth';
import { createAuditLog, serializeForAudit } from '@/lib/utils/audit';
import { sessionTypeCreateSchema, sessionTypeUpdateSchema, trackCreateSchema, trackUpdateSchema } from '@/lib/validations';

// ============== SESSION TYPES ==============

export async function getSessionTypes(congressId?: string) {
  return db.sessionType.findMany({
    where: {
      OR: [
        { isSystem: true },
        ...(congressId ? [{ congressId }] : []),
      ],
    },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getSessionType(id: string) {
  return db.sessionType.findUnique({ where: { id } });
}

export async function createSessionType(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = sessionTypeCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const sessionType = await db.sessionType.create({
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'SessionType',
      entityId: sessionType.id,
      action: 'CREATE',
      after: serializeForAudit(sessionType),
    });

    revalidatePath('/admin/programme/types');
    return { success: true, data: sessionType };
  } catch (error) {
    console.error('Failed to create session type:', error);
    return { success: false, error: 'Failed to create session type' };
  }
}

export async function updateSessionType(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = sessionTypeUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.sessionType.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Session type not found' };
    }

    if (existing.isSystem) {
      // Only allow updating certain fields for system types
      const { name, code, ...allowedUpdates } = parsed.data;
      const sessionType = await db.sessionType.update({
        where: { id },
        data: allowedUpdates,
      });

      await createAuditLog({
        userId: user.id,
        entityType: 'SessionType',
        entityId: sessionType.id,
        action: 'UPDATE',
        before: serializeForAudit(existing),
        after: serializeForAudit(sessionType),
      });

      revalidatePath('/admin/programme/types');
      return { success: true, data: sessionType };
    }

    const sessionType = await db.sessionType.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'SessionType',
      entityId: sessionType.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(sessionType),
    });

    revalidatePath('/admin/programme/types');
    return { success: true, data: sessionType };
  } catch (error) {
    console.error('Failed to update session type:', error);
    return { success: false, error: 'Failed to update session type' };
  }
}

export async function deleteSessionType(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.sessionType.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Session type not found' };
    }

    if (existing.isSystem) {
      return { success: false, error: 'Cannot delete system session types' };
    }

    await db.sessionType.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'SessionType',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/programme/types');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete session type:', error);
    return { success: false, error: 'Failed to delete session type' };
  }
}

// ============== TRACKS ==============

export async function getTracks(congressId: string) {
  return db.track.findMany({
    where: { congressId },
    include: {
      _count: {
        select: { sessions: true },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getTrack(id: string) {
  return db.track.findUnique({ where: { id } });
}

export async function createTrack(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = trackCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const track = await db.track.create({
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Track',
      entityId: track.id,
      action: 'CREATE',
      after: serializeForAudit(track),
    });

    revalidatePath('/admin/programme/tracks');
    return { success: true, data: track };
  } catch (error) {
    console.error('Failed to create track:', error);
    return { success: false, error: 'Failed to create track' };
  }
}

export async function updateTrack(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = trackUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.track.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Track not found' };
    }

    const track = await db.track.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Track',
      entityId: track.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(track),
    });

    revalidatePath('/admin/programme/tracks');
    return { success: true, data: track };
  } catch (error) {
    console.error('Failed to update track:', error);
    return { success: false, error: 'Failed to update track' };
  }
}

export async function deleteTrack(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.track.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Track not found' };
    }

    await db.track.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'Track',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/programme/tracks');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete track:', error);
    return { success: false, error: 'Failed to delete track' };
  }
}

// Reorder tracks
export async function reorderTracks(trackIds: string[]) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await Promise.all(
      trackIds.map((id, index) =>
        db.track.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    revalidatePath('/admin/programme/tracks');
    return { success: true };
  } catch (error) {
    console.error('Failed to reorder tracks:', error);
    return { success: false, error: 'Failed to reorder tracks' };
  }
}
