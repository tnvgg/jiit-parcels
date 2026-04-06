export const PRICING_RULES = {
  day: { min: 15, suggested: 20, max: 50 },      
  night: { min: 20, suggested: 25, max: 40 },   
  lateNight: { min: 20, suggested: 25, max: 50 } 
} as const;

export function getPricingForTime(hour: number) {
  if (hour >= 6 && hour < 18) return PRICING_RULES.day;
  if (hour >= 18 && hour < 22) return PRICING_RULES.night;
  return PRICING_RULES.lateNight;
}

export function canIncreasePrice(lastUpdate: Date): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - lastUpdate.getTime() > fiveMinutes;
}