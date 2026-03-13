'use server';

// Congress CRUD operations
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser, canManageCongress } from '@/lib/auth';
import { createAuditLog, serializeForAudit } from '@/lib/utils/audit';
import { congressCreateSchema, congressUpdateSchema } from '@/lib/validations';
import { DEFAULT_SESSION_TYPES } from '@/config/constants';
import type { Congress, CongressStatus } from '@prisma/client';

// Get all congresses
export async function getCongresses() {
  const user = await getCurrentUser();
  
  const congresses = await db.congress.findMany({
    orderBy: [
      { isCurrent: 'desc' },
      { year: 'desc' },
    ],
    include: {
      _count: {
        select: {
          sessions: true,
          programDays: true,
          venues: true,
        },
      },
    },
  });

  return congresses;
}

// Get single congress
export async function getCongress(id: string) {
  const congress = await db.congress.findUnique({
    where: { id },
    include: {
      venues: {
        include: {
          rooms: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      },
      programDays: {
        orderBy: { order: 'asc' },
      },
      tracks: {
        orderBy: { displayOrder: 'asc' },
      },
      sessionTypes: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return congress;
}

// Get current congress
export async function getCurrentCongress() {
  const congress = await db.congress.findFirst({
    where: {
      isCurrent: true,
      status: 'PUBLISHED',
    },
    include: {
      venues: {
        include: {
          rooms: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      },
      programDays: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
      tracks: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return congress;
}

// Create congress
export async function createCongress(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageCongress(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = congressCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    // If this is set as current, unset other current congresses
    if (parsed.data.isCurrent) {
      await db.congress.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const congress = await db.congress.create({
      data: {
        ...parsed.data,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
    });

    // Create default session types for this congress
    await db.sessionType.createMany({
      data: DEFAULT_SESSION_TYPES.map((type) => ({
        congressId: congress.id,
        name: type.name,
        code: type.code,
        color: type.color,
        textColor: type.textColor,
        icon: type.icon,
        displayOrder: type.displayOrder,
        affectsPublicAgenda: type.affectsPublicAgenda ?? true,
        isSystem: false,
      })),
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Congress',
      entityId: congress.id,
      action: 'CREATE',
      after: serializeForAudit(congress),
    });

    revalidatePath('/admin/congresses');
    return { success: true, data: congress };
  } catch (error) {
    console.error('Failed to create congress:', error);
    return { success: false, error: 'Failed to create congress' };
  }
}

// Update congress
export async function updateCongress(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageCongress(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = congressUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.congress.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Congress not found' };
    }

    // If this is set as current, unset other current congresses
    if (parsed.data.isCurrent) {
      await db.congress.updateMany({
        where: { isCurrent: true, id: { not: id } },
        data: { isCurrent: false },
      });
    }

    const updateData = {
      ...parsed.data,
      ...(parsed.data.startDate && { startDate: new Date(parsed.data.startDate) }),
      ...(parsed.data.endDate && { endDate: new Date(parsed.data.endDate) }),
    };

    const congress = await db.congress.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Congress',
      entityId: congress.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(congress),
    });

    revalidatePath('/admin/congresses');
    revalidatePath(`/admin/congresses/${id}`);
    return { success: true, data: congress };
  } catch (error) {
    console.error('Failed to update congress:', error);
    return { success: false, error: 'Failed to update congress' };
  }
}

// Delete congress
export async function deleteCongress(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageCongress(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.congress.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Congress not found' };
    }

    // This will cascade delete all related entities
    await db.congress.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'Congress',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/congresses');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete congress:', error);
    return { success: false, error: 'Failed to delete congress' };
  }
}

// Set congress status
export async function setCongressStatus(id: string, status: CongressStatus) {
  const user = await getCurrentUser();
  
  if (!user || !canManageCongress(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.congress.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Congress not found' };
    }

    const congress = await db.congress.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Congress',
      entityId: congress.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(congress),
      metadata: { field: 'status', oldValue: existing.status, newValue: status },
    });

    revalidatePath('/admin/congresses');
    return { success: true, data: congress };
  } catch (error) {
    console.error('Failed to update congress status:', error);
    return { success: false, error: 'Failed to update congress status' };
  }
}

// Generate program days for congress
export async function generateProgramDays(congressId: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageCongress(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const congress = await db.congress.findUnique({ where: { id: congressId } });
    if (!congress) {
      return { success: false, error: 'Congress not found' };
    }

    // Generate days between start and end date
    const days: Date[] = [];
    const current = new Date(congress.startDate);
    const end = new Date(congress.endDate);
    
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Create program days
    const programDays = await db.programDay.createMany({
      data: days.map((date, index) => ({
        congressId,
        label: formatDayLabel(date),
        date,
        order: index,
      })),
      skipDuplicates: true,
    });

    revalidatePath('/admin/programme/days');
    return { success: true, data: programDays };
  } catch (error) {
    console.error('Failed to generate program days:', error);
    return { success: false, error: 'Failed to generate program days' };
  }
}

// Helper to format day label
function formatDayLabel(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `${days[date.getDay()]} ${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
