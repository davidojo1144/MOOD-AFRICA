import { UserProfile } from '@/types/vecdim';

export const DEMO_USERS: UserProfile[] = [
  {
    user_id: 'u_field_01',
    name: 'Field Worker 1 (Lagos)',
    role: 'field',
    state: 'Lagos',
  },
  {
    user_id: 'u_field_02',
    name: 'Field Worker 2 (Kano)',
    role: 'field',
    state: 'Kano',
  },
  {
    user_id: 'u_field_03',
    name: 'Field Worker 3 (Osun)',
    role: 'field',
    state: 'Osun',
  },
  {
    user_id: 'u_vecdim_lagos',
    name: 'VECDIM State User (Lagos)',
    role: 'vecdim',
    state: 'Lagos',
  },
  {
    user_id: 'u_vecdim_kano',
    name: 'VECDIM State User (Kano)',
    role: 'vecdim',
    state: 'Kano',
  },
  {
    user_id: 'u_vecdim_osun',
    name: 'VECDIM State User (Osun)',
    role: 'vecdim',
    state: 'Osun',
  },
  {
    user_id: 'u_uniosun_01',
    name: 'UNIOSUN National User',
    role: 'uniosun',
  },
];
