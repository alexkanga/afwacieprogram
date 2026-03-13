// Type definitions for AfWASA Congress Program Manager

import type {
  Congress,
  Venue,
  Room,
  ProgramDay,
  SessionType,
  Track,
  Organization,
  Person,
  Session,
  SessionRoom,
  SessionPerson,
  User,
  ImportJob,
  ExportJob,
  AuditLog,
  CongressStatus,
  PublicationStatus,
  SessionRoomMode,
  UserRole,
  PersonSessionRole,
  OrganizationType,
} from '@prisma/client';

// Re-export Prisma types
export type {
  Congress,
  Venue,
  Room,
  ProgramDay,
  SessionType,
  Track,
  Organization,
  Person,
  Session,
  SessionRoom,
  SessionPerson,
  User,
  ImportJob,
  ExportJob,
  AuditLog,
};

// Enum exports
export type {
  CongressStatus as CongressStatusType,
  PublicationStatus as PublicationStatusType,
  SessionRoomMode as SessionRoomModeType,
  UserRole as UserRoleType,
  PersonSessionRole as PersonSessionRoleType,
  OrganizationType as OrganizationTypeType,
};

// Extended types with relations
export interface SessionWithRelations extends Session {
  sessionType?: SessionType | null;
  track?: Track | null;
  day: ProgramDay;
  rooms: (SessionRoom & { room: Room })[];
  persons: (SessionPerson & { person: Person })[];
}

export interface CongressWithRelations extends Congress {
  venues: (Venue & { rooms: Room[] })[];
  programDays: ProgramDay[];
  tracks: Track[];
  sessionTypes: SessionType[];
}

export interface PersonWithOrganization extends Person {
  organization?: Organization | null;
}

// Form types
export interface CongressFormData {
  title: string;
  shortName?: string;
  year: number;
  startDate: Date;
  endDate: Date;
  city?: string;
  country?: string;
  venueName?: string;
  description?: string;
  timezone?: string;
  status?: CongressStatus;
  defaultLanguage?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  publicSlug?: string;
  isCurrent?: boolean;
}

export interface SessionFormData {
  congressId: string;
  dayId: string;
  title: string;
  subtitle?: string;
  description?: string;
  sessionTypeId?: string;
  trackId?: string;
  startTime: string;
  endTime: string;
  roomDisplayMode?: SessionRoomMode;
  isGlobalEvent?: boolean;
  colorOverride?: string;
  textColorOverride?: string;
  organizerText?: string;
  notes?: string;
  publicationStatus?: PublicationStatus;
  roomIds: string[];
  persons: {
    personId: string;
    role: PersonSessionRole;
    sortOrder?: number;
  }[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Table/Pagination types
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TableFilters {
  search?: string;
  status?: string;
  date?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Conflict detection
export interface SessionConflict {
  type: 'ROOM_OVERLAP' | 'TIME_OVERLAP' | 'SPEAKER_DOUBLE_BOOKING';
  sessionId: string;
  conflictingSessionId: string;
  message: string;
  details: {
    roomId?: string;
    roomName?: string;
    startTime?: string;
    endTime?: string;
  };
}

// Import types
export interface ImportPreviewRow {
  rowNumber: number;
  data: Record<string, string>;
  mappedData?: Partial<SessionFormData>;
  warnings: string[];
  errors: string[];
}

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  rowsWithWarnings: number;
  rowsWithErrors: number;
  days: { label: string; date: string }[];
  rooms: { name: string; code: string }[];
  preview: ImportPreviewRow[];
}

// Public view types
export interface ProgramGridCell {
  sessionId: string;
  title: string;
  subtitle?: string;
  startTime: string;
  endTime: string;
  color?: string;
  textColor?: string;
  isGlobal: boolean;
  sessionType?: string;
  trackName?: string;
  roomName: string;
  span: number; // For multi-slot sessions
  persons: { name: string; role: PersonSessionRole }[];
}

export interface ProgramTimeSlot {
  time: string;
  cells: ProgramGridCell[];
}

export interface ProgramDayView {
  day: ProgramDay;
  rooms: Room[];
  timeSlots: ProgramTimeSlot[];
  globalEvents: ProgramGridCell[];
}

// Navigation
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}

// Audit log
export interface AuditLogEntry {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  timestamp: Date;
}
