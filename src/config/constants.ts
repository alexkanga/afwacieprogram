// Application constants for AfWASA Congress Program Manager

// Session Types - System defaults
export const DEFAULT_SESSION_TYPES = [
  { name: 'Plenary', code: 'PLENARY', color: '#1e40af', textColor: '#ffffff', icon: 'Users', displayOrder: 1 },
  { name: 'Keynote', code: 'KEYNOTE', color: '#7c3aed', textColor: '#ffffff', icon: 'Mic', displayOrder: 2 },
  { name: 'Symposium', code: 'SYMPOSIUM', color: '#0891b2', textColor: '#ffffff', icon: 'BookOpen', displayOrder: 3 },
  { name: 'Forum', code: 'FORUM', color: '#0d9488', textColor: '#ffffff', icon: 'MessageSquare', displayOrder: 4 },
  { name: 'Dialogue', code: 'DIALOGUE', color: '#059669', textColor: '#ffffff', icon: 'MessagesSquare', displayOrder: 5 },
  { name: 'Technical Session', code: 'TECHNICAL', color: '#ca8a04', textColor: '#ffffff', icon: 'Cog', displayOrder: 6 },
  { name: 'Workshop', code: 'WORKSHOP', color: '#ea580c', textColor: '#ffffff', icon: 'Wrench', displayOrder: 7 },
  { name: 'Exhibition', code: 'EXHIBITION', color: '#dc2626', textColor: '#ffffff', icon: 'LayoutGrid', displayOrder: 8 },
  { name: 'Break', code: 'BREAK', color: '#6b7280', textColor: '#ffffff', icon: 'Coffee', affectsPublicAgenda: false, displayOrder: 9 },
  { name: 'Lunch', code: 'LUNCH', color: '#78716c', textColor: '#ffffff', icon: 'Utensils', affectsPublicAgenda: false, displayOrder: 10 },
  { name: 'Dinner', code: 'DINNER', color: '#71717a', textColor: '#ffffff', icon: 'ChefHat', affectsPublicAgenda: false, displayOrder: 11 },
  { name: 'Cocktail', code: 'COCKTAIL', color: '#a3a3a3', textColor: '#1f2937', icon: 'GlassWater', affectsPublicAgenda: false, displayOrder: 12 },
  { name: 'Ceremony', code: 'CEREMONY', color: '#be185d', textColor: '#ffffff', icon: 'Sparkles', displayOrder: 13 },
  { name: 'Press Conference', code: 'PRESS', color: '#b91c1c', textColor: '#ffffff', icon: 'Newspaper', displayOrder: 14 },
  { name: 'Visit', code: 'VISIT', color: '#15803d', textColor: '#ffffff', icon: 'MapPin', displayOrder: 15 },
  { name: 'Free Slot', code: 'FREE', color: '#e5e7eb', textColor: '#374151', icon: 'Circle', affectsPublicAgenda: false, displayOrder: 16 },
  { name: 'Other', code: 'OTHER', color: '#9ca3af', textColor: '#1f2937', icon: 'MoreHorizontal', displayOrder: 99 },
] as const;

// Role permissions
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canManageUsers: true,
    canManageCongress: true,
    canManageProgram: true,
    canImport: true,
    canExport: true,
    canPublish: true,
    canDelete: true,
    canViewAudit: true,
  },
  PROGRAM_ADMIN: {
    canManageUsers: false,
    canManageCongress: true,
    canManageProgram: true,
    canImport: true,
    canExport: true,
    canPublish: true,
    canDelete: true,
    canViewAudit: true,
  },
  CONTENT_EDITOR: {
    canManageUsers: false,
    canManageCongress: false,
    canManageProgram: true,
    canImport: false,
    canExport: true,
    canPublish: false,
    canDelete: false,
    canViewAudit: false,
  },
  PUBLIC_USER: {
    canManageUsers: false,
    canManageCongress: false,
    canManageProgram: false,
    canImport: false,
    canExport: false,
    canPublish: false,
    canDelete: false,
    canViewAudit: false,
  },
} as const;

// Status labels
export const CONGRESS_STATUS_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
} as const;

export const PUBLICATION_STATUS_LABELS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
  HIDDEN: 'Hidden',
} as const;

export const SESSION_ROOM_MODE_LABELS = {
  SINGLE_ROOM: 'Single Room',
  MULTI_ROOM: 'Multiple Rooms',
  ALL_ROOMS: 'All Rooms',
  NO_ROOM: 'No Room',
} as const;

// Person role labels
export const PERSON_ROLE_LABELS = {
  SPEAKER: 'Speaker',
  CHAIR: 'Chair',
  MODERATOR: 'Moderator',
  PANELIST: 'Panelist',
  FACILITATOR: 'Facilitator',
  ORGANIZER: 'Organizer',
  PRESENTER: 'Presenter',
} as const;

// Organization type labels
export const ORGANIZATION_TYPE_LABELS = {
  GOVERNMENT: 'Government',
  NGO: 'NGO',
  PRIVATE_COMPANY: 'Private Company',
  INTERNATIONAL_ORG: 'International Organization',
  RESEARCH_INSTITUTE: 'Research Institute',
  UNIVERSITY: 'University',
  CONSULTANCY: 'Consultancy',
  UTILITY: 'Utility',
  OTHER: 'Other',
} as const;

// Time zones relevant for African conferences
export const AFRICAN_TIMEZONES = [
  { value: 'Africa/Abidjan', label: 'Abidjan (GMT)' },
  { value: 'Africa/Accra', label: 'Accra (GMT)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Dakar', label: 'Dakar (GMT)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (WET)' },
] as const;

// Default colors for tracks (when no color is set)
export const DEFAULT_TRACK_COLORS = [
  '#1e40af', // Blue
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#0d9488', // Teal
  '#059669', // Green
  '#ca8a04', // Yellow
  '#ea580c', // Orange
  '#dc2626', // Red
  '#be185d', // Pink
  '#475569', // Slate
] as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  pageSize: 20,
  maxPageSize: 100,
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExcelTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
} as const;

// App metadata
export const APP_CONFIG = {
  name: 'AfWASA Congress Program Manager',
  shortName: 'AfWASA Congress',
  description: 'Congress program management for the African Water and Sanitation Association',
  version: '1.0.0',
} as const;
