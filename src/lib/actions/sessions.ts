'use server';

// Session CRUD operations
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser, canManageProgram, canPublish } from '@/lib/auth';
import { createAuditLog, serializeForAudit } from '@/lib/utils/audit';
import { sessionCreateSchema, sessionUpdateSchema } from '@/lib/validations';
import { timeRangesOverlap } from '@/lib/utils/date';
import type { Session, PublicationStatus, SessionRoomMode } from '@prisma/client';

// Get sessions for a congress
export async function getSessions(congressId: string, options?: {
  dayId?: string;
  status?: PublicationStatus;
  search?: string;
}) {
  return db.session.findMany({
    where: {
      congressId,
      ...(options?.dayId && { dayId: options.dayId }),
      ...(options?.status && { publicationStatus: options.status }),
      ...(options?.search && {
        OR: [
          { title: { contains: options.search } },
          { subtitle: { contains: options.search } },
        ],
      }),
    },
    include: {
      day: true,
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
    orderBy: [
      { day: { order: 'asc' } },
      { startTime: 'asc' },
    ],
  });
}

// Get single session
export async function getSession(id: string) {
  return db.session.findUnique({
    where: { id },
    include: {
      congress: true,
      day: true,
      sessionType: true,
      track: true,
      rooms: {
        include: { room: { include: { venue: true } } },
      },
      persons: {
        include: { person: { include: { organization: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

// Create session
export async function createSession(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = sessionCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    // Check for conflicts
    const conflicts = await checkSessionConflicts(
      parsed.data.dayId,
      parsed.data.startTime,
      parsed.data.endTime,
      parsed.data.roomIds,
      parsed.data.roomDisplayMode,
      parsed.data.isGlobalEvent
    );

    if (conflicts.length > 0 && !parsed.data.isGlobalEvent) {
      return { success: false, error: 'Session conflicts detected', conflicts };
    }

    const { roomIds, ...sessionData } = parsed.data;
    
    // Generate session code
    const sessionCode = await generateSessionCode(sessionData.congressId);

    const session = await db.session.create({
      data: {
        ...sessionData,
        sessionCode,
        rooms: {
          create: roomIds.map((roomId, index) => ({
            roomId,
            spanOrder: index,
          })),
        },
      },
      include: {
        rooms: { include: { room: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Session',
      entityId: session.id,
      action: 'CREATE',
      after: serializeForAudit(session),
    });

    revalidatePath('/admin/programme/sessions');
    return { success: true, data: session };
  } catch (error) {
    console.error('Failed to create session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

// Update session
export async function updateSession(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = sessionUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.session.findUnique({
      where: { id },
      include: { rooms: true },
    });
    
    if (!existing) {
      return { success: false, error: 'Session not found' };
    }

    const { roomIds, ...sessionData } = parsed.data;

    // Check for conflicts if times/rooms changed
    if (sessionData.startTime || sessionData.endTime || roomIds) {
      const conflicts = await checkSessionConflicts(
        sessionData.dayId || existing.dayId,
        sessionData.startTime || existing.startTime,
        sessionData.endTime || existing.endTime,
        roomIds || existing.rooms.map(r => r.roomId),
        sessionData.roomDisplayMode || existing.roomDisplayMode,
        sessionData.isGlobalEvent ?? existing.isGlobalEvent,
        id // Exclude current session from conflict check
      );

      if (conflicts.length > 0 && !(sessionData.isGlobalEvent ?? existing.isGlobalEvent)) {
        return { success: false, error: 'Session conflicts detected', conflicts };
      }
    }

    // Update room assignments if provided
    if (roomIds) {
      await db.sessionRoom.deleteMany({ where: { sessionId: id } });
      await db.sessionRoom.createMany({
        data: roomIds.map((roomId, index) => ({
          sessionId: id,
          roomId,
          spanOrder: index,
        })),
      });
    }

    const session = await db.session.update({
      where: { id },
      data: sessionData,
      include: {
        rooms: { include: { room: true } },
        persons: { include: { person: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Session',
      entityId: session.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(session),
    });

    revalidatePath('/admin/programme/sessions');
    revalidatePath(`/admin/programme/sessions/${id}`);
    return { success: true, data: session };
  } catch (error) {
    console.error('Failed to update session:', error);
    return { success: false, error: 'Failed to update session' };
  }
}

// Delete session
export async function deleteSession(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.session.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Session not found' };
    }

    // Delete related records first
    await db.sessionRoom.deleteMany({ where: { sessionId: id } });
    await db.sessionPerson.deleteMany({ where: { sessionId: id } });
    await db.session.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'Session',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/programme/sessions');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete session:', error);
    return { success: false, error: 'Failed to delete session' };
  }
}

// Set session status
export async function setSessionStatus(id: string, status: PublicationStatus) {
  const user = await getCurrentUser();
  
  if (!user || !canPublish(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.session.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Session not found' };
    }

    const session = await db.session.update({
      where: { id },
      data: { publicationStatus: status },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Session',
      entityId: session.id,
      action: status === 'PUBLISHED' ? 'PUBLISH' : 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(session),
      metadata: { field: 'publicationStatus', oldValue: existing.publicationStatus, newValue: status },
    });

    revalidatePath('/admin/programme/sessions');
    return { success: true, data: session };
  } catch (error) {
    console.error('Failed to update session status:', error);
    return { success: false, error: 'Failed to update session status' };
  }
}

// Cancel session
export async function cancelSession(id: string, reason?: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.session.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Session not found' };
    }

    const session = await db.session.update({
      where: { id },
      data: {
        isCancelled: true,
        cancellationReason: reason,
        publicationStatus: 'CANCELLED',
      },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Session',
      entityId: session.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(session),
      metadata: { action: 'cancel', reason },
    });

    revalidatePath('/admin/programme/sessions');
    return { success: true, data: session };
  } catch (error) {
    console.error('Failed to cancel session:', error);
    return { success: false, error: 'Failed to cancel session' };
  }
}

// Duplicate session
export async function duplicateSession(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await getSession(id);
    if (!existing) {
      return { success: false, error: 'Session not found' };
    }

    const sessionCode = await generateSessionCode(existing.congressId);

    const newSession = await db.session.create({
      data: {
        congressId: existing.congressId,
        dayId: existing.dayId,
        title: `${existing.title} (Copy)`,
        subtitle: existing.subtitle,
        description: existing.description,
        sessionTypeId: existing.sessionTypeId,
        trackId: existing.trackId,
        startTime: existing.startTime,
        endTime: existing.endTime,
        roomDisplayMode: existing.roomDisplayMode,
        isGlobalEvent: existing.isGlobalEvent,
        colorOverride: existing.colorOverride,
        textColorOverride: existing.textColorOverride,
        organizerText: existing.organizerText,
        notes: existing.notes,
        sessionCode,
        publicationStatus: 'DRAFT',
        rooms: {
          create: existing.rooms.map((r, index) => ({
            roomId: r.roomId,
            spanOrder: index,
          })),
        },
        persons: {
          create: existing.persons.map(p => ({
            personId: p.personId,
            role: p.role,
            sortOrder: p.sortOrder,
          })),
        },
      },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Session',
      entityId: newSession.id,
      action: 'CREATE',
      metadata: { duplicatedFrom: id },
    });

    revalidatePath('/admin/programme/sessions');
    return { success: true, data: newSession };
  } catch (error) {
    console.error('Failed to duplicate session:', error);
    return { success: false, error: 'Failed to duplicate session' };
  }
}

// Add person to session
export async function addSessionPerson(sessionId: string, personId: string, role: string, sortOrder?: number) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const sessionPerson = await db.sessionPerson.create({
      data: {
        sessionId,
        personId,
        role: role as any,
        sortOrder: sortOrder ?? 0,
      },
      include: { person: true },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'SessionPerson',
      entityId: sessionPerson.id,
      action: 'CREATE',
      metadata: { sessionId, personId, role },
    });

    revalidatePath(`/admin/programme/sessions/${sessionId}`);
    return { success: true, data: sessionPerson };
  } catch (error) {
    console.error('Failed to add person to session:', error);
    return { success: false, error: 'Failed to add person to session' };
  }
}

// Remove person from session
export async function removeSessionPerson(sessionId: string, personId: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db.sessionPerson.deleteMany({
      where: { sessionId, personId },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'SessionPerson',
      entityId: `${sessionId}-${personId}`,
      action: 'DELETE',
      metadata: { sessionId, personId },
    });

    revalidatePath(`/admin/programme/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to remove person from session:', error);
    return { success: false, error: 'Failed to remove person from session' };
  }
}

// ============== HELPER FUNCTIONS ==============

async function generateSessionCode(congressId: string): Promise<string> {
  const count = await db.session.count({ where: { congressId } });
  const year = new Date().getFullYear().toString().slice(-2);
  return `SES-${year}-${String(count + 1).padStart(4, '0')}`;
}

// Get data for session form
export async function getSessionFormData() {
  const congress = await db.congress.findFirst({
    where: { isCurrent: true },
    include: {
      programDays: { orderBy: { order: 'asc' } },
      venues: { 
        include: { 
          rooms: { 
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
          } 
        } 
      },
      tracks: { 
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' } 
      },
    },
  });

  if (!congress) {
    return null;
  }

  const sessionTypes = await db.sessionType.findMany({
    where: {
      OR: [
        { isSystem: true },
        { congressId: congress.id },
      ],
    },
    orderBy: { displayOrder: 'asc' },
  });

  return {
    congressId: congress.id,
    days: congress.programDays.map(d => ({ id: d.id, label: d.label })),
    rooms: congress.venues.flatMap(v => 
      v.rooms.map(r => ({ id: r.id, name: r.name, venueName: v.name, color: r.color }))
    ),
    tracks: congress.tracks.map(t => ({ id: t.id, name: t.name, color: t.color, textColor: t.textColor })),
    sessionTypes: sessionTypes.map(st => ({ id: st.id, name: st.name, color: st.color, textColor: st.textColor })),
  };
}

async function checkSessionConflicts(
  dayId: string,
  startTime: string,
  endTime: string,
  roomIds: string[],
  roomDisplayMode: SessionRoomMode,
  isGlobalEvent: boolean,
  excludeSessionId?: string
): Promise<Array<{ sessionId: string; title: string; roomName: string; message: string }>> {
  if (isGlobalEvent || roomDisplayMode === 'NO_ROOM' || roomDisplayMode === 'ALL_ROOMS') {
    return []; // Global events and no-room sessions don't have room conflicts
  }

  const conflictingSessions = await db.session.findMany({
    where: {
      dayId,
      publicationStatus: { not: 'CANCELLED' },
      isCancelled: false,
      isGlobalEvent: false,
      ...(excludeSessionId && { id: { not: excludeSessionId } }),
      rooms: {
        some: {
          roomId: { in: roomIds },
        },
      },
    },
    include: {
      rooms: { include: { room: true } },
    },
  });

  const conflicts: Array<{ sessionId: string; title: string; roomName: string; message: string }> = [];

  for (const session of conflictingSessions) {
    if (timeRangesOverlap(startTime, endTime, session.startTime, session.endTime)) {
      const roomNames = session.rooms.map(r => r.room.name).join(', ');
      conflicts.push({
        sessionId: session.id,
        title: session.title,
        roomName: roomNames,
        message: `Conflicts with "${session.title}" (${session.startTime}-${session.endTime}) in ${roomNames}`,
      });
    }
  }

  return conflicts;
}
