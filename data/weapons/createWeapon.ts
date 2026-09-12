// ==========================================
// Apex Suite: Math Lab - Weapon factory
// ==========================================

import type { Subject, WeaponItem } from '@/types/mathLab';

type WeaponDraft = Omit<WeaponItem, 'subject'>;

export function createWeapon(subject: Subject, draft: WeaponDraft): WeaponItem {
  return { subject, ...draft };
}
