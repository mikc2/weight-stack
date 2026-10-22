import { DEFAULT_BAR, DEFAULT_INVENTORY, type PlateStock, type Unit } from "./plates";

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

export type Settings = {
  /** The unit printed on the gym's plates. */
  plateUnit: Unit;
  bar: Record<Unit, number>;
  collars: boolean;
  inventory: Record<Unit, PlateStock[]>;
};

export const DEFAULT_SETTINGS: Settings = {
  plateUnit: "kg",
  bar: DEFAULT_BAR,
  collars: false,
  inventory: DEFAULT_INVENTORY,
};
