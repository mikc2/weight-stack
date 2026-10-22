import { DEFAULT_INVENTORY, type PlateStock, type Unit } from "./plates";

/** How a plate is drawn: color and size in px on the big barbell. */
export type PlateLook = { color: string; w: number; h: number };

const RED = "#D7263D";
const BLUE = "#1E5BD8";
const YELLOW = "#F2C230";
const GREEN = "#2E9E5B";
const WHITE = "#F2F2F0";
const GREY = "#5A5D63";
const CHROME = "#C9CCD1";

export const PLATE_LOOK: Record<Unit, Record<string, PlateLook>> = {
  kg: {
    "25": { color: RED, w: 20, h: 135 },
    "20": { color: BLUE, w: 18, h: 135 },
    "15": { color: YELLOW, w: 16, h: 120 },
    "10": { color: GREEN, w: 14, h: 106 },
    "5": { color: WHITE, w: 12, h: 78 },
    "2.5": { color: GREY, w: 10, h: 63 },
    "1.25": { color: CHROME, w: 8, h: 52 },
  },
  lb: {
    "45": { color: BLUE, w: 20, h: 135 },
    "35": { color: YELLOW, w: 18, h: 122 },
    "25": { color: GREEN, w: 16, h: 104 },
    "10": { color: WHITE, w: 13, h: 83 },
    "5": { color: GREY, w: 11, h: 68 },
    "2.5": { color: CHROME, w: 9, h: 56 },
  },
};

export function plateLook(unit: Unit, weight: number): PlateLook {
  return PLATE_LOOK[unit][String(weight)] ?? { color: GREY, w: 10, h: 70 };
}

export const QUICK_PICKS: Record<Unit, number[]> = {
  kg: [60, 80, 100, 140, 180],
  lb: [135, 185, 225, 315, 405],
};

/** −/+ step in the typed unit. */
export const BUMP_STEP: Record<Unit, number> = { kg: 2.5, lb: 5 };

export type BarTypeId = "oly" | "women" | "tech" | "machine";

export type BarType = {
  id: BarTypeId;
  name: string;
  /** Shown on the Bar type button. */
  short: string;
  kg: number;
  lb: number;
  detail: string;
  group: "barbell" | "machine";
};

/** Every type loads both sides evenly; only the starting weight differs. */
export const BAR_TYPES: Record<BarTypeId, BarType> = {
  oly: {
    id: "oly",
    name: "Olympic bar",
    short: "Olympic",
    kg: 20,
    lb: 45,
    detail: "20 kg · 45 lb",
    group: "barbell",
  },
  women: {
    id: "women",
    name: "Women's bar",
    short: "Women's",
    kg: 15,
    lb: 35,
    detail: "15 kg · 35 lb",
    group: "barbell",
  },
  tech: {
    id: "tech",
    name: "Technique bar",
    short: "Technique",
    kg: 10,
    lb: 15,
    detail: "10 kg · 15 lb",
    group: "barbell",
  },
  machine: {
    id: "machine",
    name: "Plate-loaded machine",
    short: "Machine",
    kg: 0,
    lb: 0,
    detail: "Starts at 0 · leg press, iso-lateral row, hack squat",
    group: "machine",
  },
};

export type Pairs = PlateStock["pairs"];

/** Order the My plates −/+ buttons step through. */
export const PAIR_STEPS: Pairs[] = [0, "unlimited", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Next pair count for −/+, clamped at both ends. Counts above 10 act like 10. */
export function stepPairs(pairs: Pairs, dir: 1 | -1): Pairs {
  let i = PAIR_STEPS.indexOf(pairs);
  if (i === -1) i = PAIR_STEPS.length - 1;
  return PAIR_STEPS[Math.min(PAIR_STEPS.length - 1, Math.max(0, i + dir))];
}

export type Settings = {
  /** The unit printed on the gym's plates. */
  plateUnit: Unit;
  barType: BarTypeId;
  collars: boolean;
  inventory: Record<Unit, PlateStock[]>;
};

export const DEFAULT_SETTINGS: Settings = {
  plateUnit: "kg",
  barType: "oly",
  collars: false,
  inventory: DEFAULT_INVENTORY,
};

/** Fix up saved settings from older versions (e.g. `bar` before `barType`). */
export function migrateSettings(saved: Settings & { bar?: unknown }): Settings {
  const settings = { ...saved };
  delete settings.bar;
  if (!Object.hasOwn(BAR_TYPES, settings.barType)) settings.barType = "oly";
  return settings;
}
