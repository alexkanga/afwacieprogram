'use server';

// Person and Organization CRUD operations
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser, canManageProgram } from '@/lib/auth';
import { createAuditLog, serializeForAudit } from '@/lib/utils/audit';
import { personCreateSchema, personUpdateSchema, organizationCreateSchema, organizationUpdateSchema } from '@/lib/validations';

// ============== ORGANIZATIONS ==============

export async function getOrganizations(options?: { search?: string; limit?: number }) {
  return db.organization.findMany({
    where: options?.search
      ? {
          OR: [
            { name: { contains: options.search } },
            { acronym: { contains: options.search } },
          ],
        }
      : undefined,
    include: {
      _count: {
        select: { persons: true },
      },
    },
    orderBy: { name: 'asc' },
    take: options?.limit,
  });
}

export async function getOrganization(id: string) {
  return db.organization.findUnique({
    where: { id },
    include: {
      persons: {
        take: 20,
        orderBy: { lastName: 'asc' },
      },
    },
  });
}

export async function createOrganization(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = organizationCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const organization = await db.organization.create({
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Organization',
      entityId: organization.id,
      action: 'CREATE',
      after: serializeForAudit(organization),
    });

    revalidatePath('/admin/organizations');
    return { success: true, data: organization };
  } catch (error) {
    console.error('Failed to create organization:', error);
    return { success: false, error: 'Failed to create organization' };
  }
}

export async function updateOrganization(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = organizationUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.organization.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Organization not found' };
    }

    const organization = await db.organization.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Organization',
      entityId: organization.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(organization),
    });

    revalidatePath('/admin/organizations');
    return { success: true, data: organization };
  } catch (error) {
    console.error('Failed to update organization:', error);
    return { success: false, error: 'Failed to update organization' };
  }
}

export async function deleteOrganization(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.organization.findUnique({
      where: { id },
      include: { _count: { select: { persons: true } } },
    });
    
    if (!existing) {
      return { success: false, error: 'Organization not found' };
    }

    if (existing._count.persons > 0) {
      return { success: false, error: 'Cannot delete organization with associated persons' };
    }

    await db.organization.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'Organization',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/organizations');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete organization:', error);
    return { success: false, error: 'Failed to delete organization' };
  }
}

// ============== PERSONS ==============

export async function getPersons(options?: { 
  search?: string; 
  organizationId?: string;
  limit?: number;
  includeOrganization?: boolean;
}) {
  return db.person.findMany({
    where: {
      ...(options?.search && {
        OR: [
          { firstName: { contains: options.search } },
          { lastName: { contains: options.search } },
          { email: { contains: options.search } },
          { displayName: { contains: options.search } },
        ],
      }),
      ...(options?.organizationId && { organizationId: options.organizationId }),
    },
    include: options?.includeOrganization ? { organization: true } : undefined,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: options?.limit,
  });
}

export async function getPerson(id: string) {
  return db.person.findUnique({
    where: { id },
    include: {
      organization: true,
      sessionPersons: {
        include: {
          session: {
            include: {
              day: true,
              sessionType: true,
            },
          },
        },
        orderBy: { session: { startTime: 'asc' } },
        take: 20,
      },
    },
  });
}

export async function createPerson(data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = personCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    // Generate display name if not provided
    const displayName = parsed.data.displayName || 
      `${parsed.data.firstName} ${parsed.data.lastName}`;

    const person = await db.person.create({
      data: {
        ...parsed.data,
        displayName,
      },
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Person',
      entityId: person.id,
      action: 'CREATE',
      after: serializeForAudit(person),
    });

    revalidatePath('/admin/people');
    return { success: true, data: person };
  } catch (error) {
    console.error('Failed to create person:', error);
    return { success: false, error: 'Failed to create person' };
  }
}

export async function updatePerson(id: string, data: unknown) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = personUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', details: parsed.error.flatten() };
  }

  try {
    const existing = await db.person.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Person not found' };
    }

    const person = await db.person.update({
      where: { id },
      data: parsed.data,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Person',
      entityId: person.id,
      action: 'UPDATE',
      before: serializeForAudit(existing),
      after: serializeForAudit(person),
    });

    revalidatePath('/admin/people');
    return { success: true, data: person };
  } catch (error) {
    console.error('Failed to update person:', error);
    return { success: false, error: 'Failed to update person' };
  }
}

export async function deletePerson(id: string) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const existing = await db.person.findUnique({
      where: { id },
      include: { _count: { select: { sessionPersons: true } } },
    });
    
    if (!existing) {
      return { success: false, error: 'Person not found' };
    }

    // Remove from sessions first
    await db.sessionPerson.deleteMany({ where: { personId: id } });
    
    await db.person.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      entityType: 'Person',
      entityId: id,
      action: 'DELETE',
      before: serializeForAudit(existing),
    });

    revalidatePath('/admin/people');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete person:', error);
    return { success: false, error: 'Failed to delete person' };
  }
}

// Bulk create persons
export async function bulkCreatePersons(persons: Array<{
  firstName: string;
  lastName: string;
  email?: string;
  organizationId?: string;
  title?: string;
  country?: string;
}>) {
  const user = await getCurrentUser();
  
  if (!user || !canManageProgram(user.role)) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const created = await db.person.createMany({
      data: persons.map(p => ({
        ...p,
        displayName: `${p.firstName} ${p.lastName}`,
      })),
      skipDuplicates: true,
    });

    await createAuditLog({
      userId: user.id,
      entityType: 'Person',
      entityId: 'bulk',
      action: 'CREATE',
      metadata: { count: created.count },
    });

    revalidatePath('/admin/people');
    return { success: true, data: { count: created.count } };
  } catch (error) {
    console.error('Failed to bulk create persons:', error);
    return { success: false, error: 'Failed to create persons' };
  }
}
