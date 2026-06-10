const UNIT_COLORS = ['#1e5a8a', '#0f766e', '#7c3aed', '#b54708', '#b42318', '#026aa2'];

export function unitAccentColor(unitId: number): string {
  return UNIT_COLORS[Math.abs(unitId) % UNIT_COLORS.length];
}
