// Zod validation schemas for AfWASA Congress Program Manager
import { z } from 'zod';

// Congress schema
export const congressSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortName: z.string().max(50).optional(),
  year: z.number().int().min(2020).max(2100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  venueName: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  timezone: z.string().default('Africa/Abidjan'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  defaultLanguage: z.string().default('en'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  publicSlug: z.string().max(100).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed').optional().or(z.literal('')),
  isCurrent: z.boolean().default(false),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

export const congressCreateSchema = congressSchema;
export const congressUpdateSchema = congressSchema.partial();

// Program Day schema
export const programDaySchema = z.object({
  congressId: z.string().cuid(),
  label: z.string().min(1, 'Label is required'),
  date: z.coerce.date(),
  order: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export const programDayCreateSchema = programDaySchema;
export const programDayUpdateSchema = programDaySchema.partial().omit({ congressId: true });

// Venue schema
export const venueSchema = z.object({
  congressId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(200),
  code: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
});

export const venueCreateSchema = venueSchema;
export const venueUpdateSchema = venueSchema.partial().omit({ congressId: true });

// Room schema
export const roomSchema = z.object({
  venueId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().max(20).optional(),
  capacity: z.number().int().positive().optional(),
  floor: z.string().max(50).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isPlenary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
});

export const roomCreateSchema = roomSchema;
export const roomUpdateSchema = roomSchema.partial().omit({ venueId: true });

// Session Type schema
export const sessionTypeSchema = z.object({
  congressId: z.string().cuid().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20).uppercase(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  icon: z.string().max(50).optional(),
  isSystem: z.boolean().default(false),
  affectsPublicAgenda: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
  description: z.string().max(500).optional(),
});

export const sessionTypeCreateSchema = sessionTypeSchema;
export const sessionTypeUpdateSchema = sessionTypeSchema.partial().omit({ isSystem: true });

// Track schema
export const trackSchema = z.object({
  congressId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().max(20).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const trackCreateSchema = trackSchema;
export const trackUpdateSchema = trackSchema.partial().omit({ congressId: true });

// Organization schema
export const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  acronym: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  type: z.enum(['GOVERNMENT', 'NGO', 'PRIVATE_COMPANY', 'INTERNATIONAL_ORG', 'RESEARCH_INSTITUTE', 'UNIVERSITY', 'CONSULTANCY', 'UTILITY', 'OTHER']).default('OTHER'),
  website: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
});

export const organizationCreateSchema = organizationSchema;
export const organizationUpdateSchema = organizationSchema.partial();

// Person schema
export const personSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  displayName: z.string().max(200).optional(),
  title: z.string().max(50).optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
  organizationId: z.string().cuid().optional(),
  bio: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
  twitterHandle: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

export const personCreateSchema = personSchema;
export const personUpdateSchema = personSchema.partial();

// Session schema
export const sessionSchema = z.object({
  congressId: z.string().cuid(),
  dayId: z.string().cuid(),
  title: z.string().min(1, 'Title is required').max(500),
  subtitle: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  sessionTypeId: z.string().cuid().optional(),
  trackId: z.string().cuid().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)'),
  roomDisplayMode: z.enum(['SINGLE_ROOM', 'MULTI_ROOM', 'ALL_ROOMS', 'NO_ROOM']).default('SINGLE_ROOM'),
  isGlobalEvent: z.boolean().default(false),
  colorOverride: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  textColorOverride: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().or(z.literal('')),
  organizerText: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  publicationStatus: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'HIDDEN']).default('DRAFT'),
  roomIds: z.array(z.string().cuid()).default([]),
}).refine(data => {
  // End time must be after start time
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return endMinutes > startMinutes;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine(data => {
  // Single room mode requires at least one room
  if (data.roomDisplayMode === 'SINGLE_ROOM') {
    return data.roomIds.length === 1;
  }
  return true;
}, {
  message: 'Single room mode requires exactly one room',
  path: ['roomIds'],
});

export const sessionCreateSchema = sessionSchema;
export const sessionUpdateSchema = sessionSchema.partial().omit({ congressId: true });

// Session Person schema
export const sessionPersonSchema = z.object({
  sessionId: z.string().cuid(),
  personId: z.string().cuid(),
  role: z.enum(['SPEAKER', 'CHAIR', 'MODERATOR', 'PANELIST', 'FACILITATOR', 'ORGANIZER', 'PRESENTER']).default('SPEAKER'),
  sortOrder: z.number().int().min(0).default(0),
  isConfirmed: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

// User schema
export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['SUPER_ADMIN', 'PROGRAM_ADMIN', 'CONTENT_EDITOR', 'PUBLIC_USER']).default('PUBLIC_USER'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Import schema
export const importJobSchema = z.object({
  congressId: z.string().cuid(),
  file: z.any(), // File validation done separately
});

// Filter schemas
export const tableFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
