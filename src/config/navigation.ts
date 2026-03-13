// Navigation configuration for AfWASA Congress Program Manager

import type { NavItem } from '@/types';

export const adminNavigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Congress',
    href: '/admin/congresses',
    icon: 'Building2',
  },
  {
    title: 'Programme',
    href: '#',
    icon: 'Calendar',
    children: [
      { title: 'Sessions', href: '/admin/programme/sessions' },
      { title: 'Days', href: '/admin/programme/days' },
      { title: 'Rooms', href: '/admin/programme/rooms' },
      { title: 'Tracks', href: '/admin/programme/tracks' },
      { title: 'Session Types', href: '/admin/programme/types' },
    ],
  },
  {
    title: 'People',
    href: '/admin/people',
    icon: 'Users',
  },
  {
    title: 'Organizations',
    href: '/admin/organizations',
    icon: 'Building',
  },
  {
    title: 'Import',
    href: '/admin/imports',
    icon: 'FileUp',
  },
  {
    title: 'Exports',
    href: '/admin/exports',
    icon: 'FileDown',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: 'UserCog',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
  },
];

export const publicNavigation: NavItem[] = [
  {
    title: 'Programme',
    href: '/programme',
    icon: 'Calendar',
  },
  {
    title: 'Downloads',
    href: '/downloads',
    icon: 'Download',
  },
];

export const userMenuItems: NavItem[] = [
  {
    title: 'Profile',
    href: '/admin/profile',
    icon: 'User',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
  },
];
