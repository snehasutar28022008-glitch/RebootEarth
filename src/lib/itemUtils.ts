import type { Rate, GradeFactor, AcceptedItem } from '@/lib/supabase';

export interface CategoryMapping {
  category: string;
  label: string;
  hasBattery: boolean;
  isHighValue: boolean;
  rateUnit: 'per_kg' | 'per_item';
  estimatedWeightKg: number;
}

// Maps accepted item names to rate-table categories
export const CATEGORY_MAPPINGS: CategoryMapping[] = [
  { category: 'Mobile phones', label: 'Mobile phones, smartphones and old keypad phones', hasBattery: true, isHighValue: true, rateUnit: 'per_item', estimatedWeightKg: 0.2 },
  { category: 'Chargers and adapters', label: 'Chargers and adapters', hasBattery: false, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.1 },
  { category: 'Cables and wires', label: 'Cables and wires (USB, HDMI, power)', hasBattery: false, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.1 },
  { category: 'Earphones and headphones', label: 'Earphones and headphones', hasBattery: true, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.05 },
  { category: 'Power banks and batteries', label: 'Power banks', hasBattery: true, isHighValue: true, rateUnit: 'per_kg', estimatedWeightKg: 0.2 },
  { category: 'Power banks and batteries', label: 'Small lithium-ion batteries (mobile, laptop, camera)', hasBattery: true, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.1 },
  { category: 'Laptops and tablets', label: 'Laptops and tablets', hasBattery: true, isHighValue: true, rateUnit: 'per_kg', estimatedWeightKg: 2.0 },
  { category: 'Mixed small e-waste', label: 'Keyboards and mice', hasBattery: false, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.3 },
  { category: 'Mixed small e-waste', label: 'Routers and modems', hasBattery: false, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.3 },
  { category: 'Drives and storage', label: 'Pen drives, hard drives and memory cards', hasBattery: false, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.1 },
  { category: 'Mixed small e-waste', label: 'Smartwatches and fitness bands', hasBattery: true, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.05 },
  { category: 'Mixed small e-waste', label: 'Small speakers and Bluetooth devices', hasBattery: true, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.3 },
  { category: 'Mixed small e-waste', label: 'Remotes', hasBattery: true, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.1 },
  { category: 'Mixed small e-waste', label: 'Calculators', hasBattery: true, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.1 },
  { category: 'Circuit boards', label: 'Small circuit boards', hasBattery: false, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.1 },
  { category: 'Mixed small e-waste', label: 'Small electronic toys', hasBattery: true, isHighValue: false, rateUnit: 'per_kg', estimatedWeightKg: 0.2 },
];

// Categories that show the data-wipe checklist
export const DATA_WIPE_CATEGORIES = ['Mobile phones', 'Laptops and tablets', 'Drives and storage'];

export function getCategoryMapping(label: string): CategoryMapping | undefined {
  return CATEGORY_MAPPINGS.find((m) => m.label === label);
}

export function getCategoryMappingByCategory(category: string): CategoryMapping | undefined {
  return CATEGORY_MAPPINGS.find((m) => m.category === category);
}

// Determine grade from the 3 questions
export function determineGrade(
  works: boolean | null,
  damaged: boolean | null,
  batterySwollen: boolean | null
): 'A' | 'B' | 'C' | 'Hazardous' {
  if (batterySwollen) return 'Hazardous';
  if (works && !damaged) return 'A';
  if (!works && !damaged) return 'B';
  return 'C';
}

// Determine recommendation from grade
export function getRecommendation(grade: 'A' | 'B' | 'C' | 'Hazardous'): 'recycle' | 'repair' | 'donate' {
  if (grade === 'Hazardous') return 'recycle';
  if (grade === 'A') return 'donate';
  if (grade === 'B') return 'repair';
  return 'recycle';
}

// Get handling tip
export function getHandlingTip(grade: 'A' | 'B' | 'C' | 'Hazardous', hasBattery: boolean): string {
  if (grade === 'Hazardous') {
    return 'Keep the battery away from heat sources. Do not charge or puncture it. Store it in a non-flammable container until pickup.';
  }
  if (hasBattery) {
    return 'Remove the battery if possible. Store in a dry place away from direct sunlight.';
  }
  return 'Store in a dry place. Keep cables untangled to make processing easier.';
}

// Estimate value range from rates and grade factors
export function estimateValue(
  category: string,
  grade: 'A' | 'B' | 'C' | 'Hazardous',
  rates: Rate[],
  gradeFactors: GradeFactor[],
  mapping: CategoryMapping
): { min: number; max: number; unit: 'per_kg' | 'per_item' } {
  if (grade === 'Hazardous') {
    return { min: 0, max: 0, unit: mapping.rateUnit };
  }

  const categoryRates = rates.filter((r) => r.category === category);
  if (categoryRates.length === 0) {
    return { min: 0, max: 0, unit: mapping.rateUnit };
  }

  const factor = gradeFactors.find((g) => g.grade === grade)?.factor ?? 1.0;

  if (mapping.rateUnit === 'per_item') {
    const gradeRate = categoryRates.find((r) => r.grade === grade)?.rate ?? categoryRates[0].rate;
    const value = gradeRate * factor;
    return { min: Math.round(value * 0.8), max: Math.round(value * 1.2), unit: 'per_item' };
  }

  // per_kg — estimate based on typical weight range
  const gradeRate = categoryRates.find((r) => r.grade === grade)?.rate ?? categoryRates[0].rate;
  const minWeight = mapping.estimatedWeightKg * 0.5;
  const maxWeight = mapping.estimatedWeightKg * 1.5;
  return {
    min: Math.round(gradeRate * factor * minWeight),
    max: Math.round(gradeRate * factor * maxWeight),
    unit: 'per_kg',
  };
}

// Check if an accepted item name is in the accepted list
export function isItemAccepted(name: string, acceptedItems: AcceptedItem[]): 'accepted' | 'special' | 'not_accepted' | 'special_request' | 'unknown' {
  const found = acceptedItems.find((i) => i.name === name);
  if (found) return found.type;
  return 'unknown';
}

// Get the list of accepted item labels for the picker (only 'accepted' type)
export function getAcceptedLabels(acceptedItems: AcceptedItem[]): string[] {
  return acceptedItems
    .filter((i) => i.type === 'accepted')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.name);
}
