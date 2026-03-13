'use server';

// Program Day, Venue, and Room CRUD operations
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser, canManageProgram } from '@/lib/auth';
import { createAuditLog, serializeForAudit } from '@/lib/utils/audit';
import { 
  programDayCreateSchema, programDayUpdateSchema,
  venueCreateSchema, venueUpdateSchema,
  roomCreateSchema, roomUpdateSchema,
} from '@/lib/validations';

// ============== PROGRAM DAYS ==============

export async function getProgramDays(congressId: string) {
  return db.programDay.findMany({
    where: { congressId },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { sessions: true },
      },
    },
  });
}

export async function getProgramDay(id: string) {
  return db.programDay.findUnique({
    where: { id },
    include: {
      congress: true,
      sessions: {
        include: {
          sessionType: true,
          track: true,
          rooms: {
            include: { room: true },
          },
          persons: {
            include: { person: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { startTime: 'asc' },
      },
    },
  });
}

export async function createProgramDay(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = programDayCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const day = await db.programDay.create({
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date),
      },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'ProgramDay',
      entityId: day.id,
      action: 'CREATE',
      after: serializeForAudit(day),
    });

    revalidatePath('/admin/programme/days');
    return { success: true, data: day };
  } catch (error) {
    console.error('Failed to create program day:', error);
    return { success: false, error: 'Failed to create program day' };
  }
}

export async function updateProgramDay(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = programDayUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.programDay.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Program day not found' };
    }

    const updateData = {
      ...parsed.data,
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
    };

    const day = await db.programDay.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'ProgramDay',
      entityId: day.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(day),
    });

    revalidatePath('/admin/programme/days');
    return { success: true, data: day };
  } catch (error) {
    console.error('Failed to update program day:', error);
    return { success: false, error: 'Failed to update program day' };
  }
}

export async function deleteProgramDay(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.programDay.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Program day not found' };
    }

    await db.programDay.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'ProgramDay',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/programme/days');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete program day:', error);
    return { success: false, error: 'Failed to delete program day' };
  }
}

// ============== VENUES ==============

export async function getVenues(congressId: string) {
  return db.venue.findMany({
    where: { congressId },
    include: {
      rooms: {
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { isPrimary: 'desc' },
  });
}

export async function createVenue(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = venueCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    // If this is primary, unset other primary venues
    if (parsed.data.isPrimary) {
      await db.venue.updateMany({
        where: { congressId: parsed.data.congressId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const venue = await db.venue.create({
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Venue',
      entityId: venue.id,
      action: 'CREATE',
      after: serializeForAudit(venue),
    });

    revalidatePath('/admin/programme/rooms');
    return { success: true, data: venue };
  } catch (error) {
    console.error('Failed to create venue:', error);
    return { success: false, error: 'Failed to create venue' };
  }
}

export async function updateVenue(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = venueUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.venue.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Venue not found' };
    }

    if (parsed.data.isPrimary) {
      await db.venue.updateMany({
        where: { congressId: existing.congressId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const venue = await db.venue.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Venue',
      entityId: venue.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(venue),
    });

    revalidatePath('/admin/programme/rooms');
    return { success: true, data: venue };
  } catch (error) {
    console.error('Failed to update venue:', error);
    return { success: false, error: 'Failed to update venue' };
  }
}

export async function deleteVenue(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.venue.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Venue not found' };
    }

    await db.venue.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'Venue',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/programme/rooms');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete venue:', error);
    return { success: false, error: 'Failed to delete venue' };
  }
}

// ============== ROOMS ==============

export async function getRooms(congressId: string) {
  return db.room.findMany({
    where: {
      venue: { congressId },
    },
    include: {
      venue: true,
      _count: {
        select: { sessionRooms: true },
      },
    },
    orderBy: [
      { venue: { isPrimary: 'desc' } },
      { displayOrder: 'asc' },
    ],
  });
}

export async function getRoom(id: string) {
  return db.room.findUnique({
    where: { id },
    include: {
      venue: true,
    },
  });
}

export async function createRoom(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = roomCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const room = await db.room.create({
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Room',
      entityId: room.id,
      action: 'CREATE',
      after: serializeForAudit(room),
    });

    revalidatePath('/admin/programme/rooms');
    return { success: true, data: room };
  } catch (error) {
    console.error('Failed to create room:', error);
    return { success: false, error: 'Failed to create room' };
  }
}

export async function updateRoom(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = roomUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Room not found' };
    }

    const room = await db.room.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Room',
      entityId: room.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(room),
    });

    revalidatePath('/admin/programme/rooms');
    return { success: true, data: room };
  } catch (error) {
    console.error('Failed to update room:', error);
    return { success: false, error: 'Failed to update room' };
  }
}

export async function deleteRoom(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.room.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Room not found' };
    }

    await db.room.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'Room',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/programme/rooms');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete room:', error);
    return { success: false, error: 'Failed to delete room' };
  }
}

// Reorder rooms
export async function reorderRooms(roomIds: string[]) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await Promise.all(
      roomIds.map((id, index) =>
        db.room.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    revalidatePath('/admin/programme/rooms');
    return { success: true };
  } catch (error) {
    console.error('Failed to reorder rooms:', error);
    return { success: false, error: 'Failed to reorder rooms' };
  }
}
