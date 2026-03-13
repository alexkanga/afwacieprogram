import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_SESSION_TYPES } from '@/config/constants';

// Seed route - creates initial data
export async function GET() {
  try {
    // Create system session types
    const existingTypes = await db.sessionType.count({ where: { isSystem: true } });
    
    if (existingTypes === 0) {
      await db.sessionType.createMany({
        data: DEFAULT_SESSION_TYPES.map(type => ({
          ...type,
          isSystem: true,
          congressId: null,
        })),
      });
    }

    // Create default admin user if no users exist
    const existingUsers = await db.user.count();
    
    if (existingUsers === 0) {
      // Create a simple hash for 'admin123'
      const encoder = new TextEncoder();
      const data = encoder.encode('admin123');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      await db.user.create({
        data: {
          email: 'admin@afwasa.org',
          name: 'System Admin',
          passwordHash,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Seed completed',
      sessionTypesCreated: existingTypes === 0,
      adminCreated: existingUsers === 0,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Seed failed' 
    }, { status: 500 });
  }
}
