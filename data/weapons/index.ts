// ==========================================
// Apex Suite: Math Lab - Weapons barrel export
// ==========================================

import { MATH_WEAPONS } from './mathWeapons';
import { PHYSICS_WEAPONS } from './physicsWeapons';
import { CHEMISTRY_WEAPONS } from './chemistryWeapons';

export { MATH_WEAPONS, PHYSICS_WEAPONS, CHEMISTRY_WEAPONS };

export const WEAPONS_DATA = [...MATH_WEAPONS, ...PHYSICS_WEAPONS, ...CHEMISTRY_WEAPONS];
