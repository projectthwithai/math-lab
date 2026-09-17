// ==========================================
// Apex Suite: Math Lab - Weapon factory
// ==========================================

import type { Subject, WeaponItem, WeaponMasteryChallenge } from '@/types/mathLab';
import { resolveMasteryChallenge } from './masteryChallenge';

type WeaponDraft = Omit<WeaponItem, 'subject'>;

export function createWeapon(
  subject: Subject,
  draft: WeaponDraft,
  preset?: WeaponMasteryChallenge
): WeaponItem {
  return {
    subject,
    ...draft,
    masteryChallenge: resolveMasteryChallenge(draft, preset),
  };
}
