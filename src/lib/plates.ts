export type Unit = "kg" | "lb";

export type PlateStock = { weight: number; pairs: number };

export type LoadInput = {
  typed: number;
  typedUnit: Unit;
  plateUnit: Unit;
  /** Bar weight in plateUnit. */
  bar: number;
  /** Count a 2.5 kg collar on each side. */
  collars: boolean;
  /** Plates in plateUnit. */
  inventory: PlateStock[];
};

export type LoadPlan =
  | {
      status: "below-bar";
      /** Typed weight in plateUnit. */
      target: number;
      /** Bar (+ collars) in plateUnit. */
      minimum: number;
    }
  | {
      status: "exact" | "closest";
      /** Why it is not exact: rounded to a loadable step, or not enough plates. */
      reason?: "rounded" | "inventory";
      target: number;
      /** Plates on one side, heaviest first. */
      perSide: number[];
      /** Loaded total in plateUnit. */
      loaded: number;
      /** Loaded total in typedUnit. */
      loadedTyped: number;
      /** loadedTyped − typed. */
      diffTyped: number;
    };

export const KG_PER_LB = 0.45359237;
export const COLLAR_KG = 2.5;

export const DEFAULT_BAR: Record<Unit, number> = { kg: 20, lb: 45 };

export const DEFAULT_INVENTORY: Record<Unit, PlateStock[]> = {
  kg: [
    { weight: 25, pairs: 2 },
    { weight: 20, pairs: 4 },
    { weight: 15, pairs: 2 },
    { weight: 10, pairs: 2 },
    { weight: 5, pairs: 2 },
    { weight: 2.5, pairs: 2 },
    { weight: 1.25, pairs: 2 },
  ],
  lb: [
    { weight: 45, pairs: 4 },
    { weight: 35, pairs: 2 },
    { weight: 25, pairs: 2 },
    { weight: 10, pairs: 2 },
    { weight: 5, pairs: 2 },
    { weight: 2.5, pairs: 2 },
  ],
};

/** Pair count to use. A newer app version saved "unlimited"; treat anything non-numeric as 10 pairs. */
function safePairs(pairs: unknown): number {
  if (typeof pairs !== "number" || !Number.isFinite(pairs)) return 10;
  return Math.max(0, Math.floor(pairs));
}

export function convert(n: number, from: Unit, to: Unit): number {
  if (from === to) return n;
  return from === "kg" ? n / KG_PER_LB : n * KG_PER_LB;
}

// Work in hundredths so 1.25 / 0.5 plates never hit floating-point errors.
const toCents = (n: number) => Math.round(n * 100);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function planLoad({
  typed,
  typedUnit,
  plateUnit,
  bar,
  collars,
  inventory,
}: LoadInput): LoadPlan {
  const target = convert(typed, typedUnit, plateUnit);
  const collar = collars ? convert(COLLAR_KG, "kg", plateUnit) : 0;
  const minimum = round2(bar + 2 * collar);
  if (target < minimum - 0.005) {
    return { status: "below-bar", target, minimum };
  }

  // One item per pair: using it puts one plate on each side.
  const items = inventory
    .flatMap((p) =>
      Array<number>(safePairs(p.pairs)).fill(toCents(p.weight)),
    )
    .filter((w) => w > 0)
    .sort((a, b) => b - a);

  // 0/1 knapsack over per-side sums: best[s] = fewest plates to reach s.
  const maxSide = items.reduce((sum, w) => sum + w, 0);
  const best = new Array<number>(maxSide + 1).fill(Infinity);
  best[0] = 0;
  const used = items.map(() => new Uint8Array(maxSide + 1));
  items.forEach((w, i) => {
    for (let s = maxSide; s >= w; s--) {
      if (best[s - w] + 1 < best[s]) {
        best[s] = best[s - w] + 1;
        used[i][s] = 1;
      }
    }
  });

  // Closest loadable per-side sum; a tie goes to the heavier one. For
  // standard sets this is "round to 2 × the smallest plate".
  const sideTarget = ((target - minimum) / 2) * 100;
  let side = 0;
  for (let s = 0; s <= maxSide; s++) {
    if (best[s] === Infinity) continue;
    if (Math.abs(s - sideTarget) <= Math.abs(side - sideTarget)) side = s;
  }

  const perSide = greedy(side, items) ?? fewest(side, items, used);
  const loaded = round2(minimum + (2 * side) / 100);
  const loadedTyped = convert(loaded, plateUnit, typedUnit);
  const exact = Math.abs(loaded - target) < 0.005;
  return {
    status: exact ? "exact" : "closest",
    reason: exact
      ? undefined
      : sideTarget > maxSide
        ? "inventory"
        : "rounded",
    target,
    perSide,
    loaded,
    loadedTyped,
    diffTyped: loadedTyped - typed,
  };
}

/** Heaviest plate first. `items` is already sorted descending. Null if it can't hit `side`. */
function greedy(side: number, items: number[]): number[] | null {
  const plates: number[] = [];
  let rest = side;
  for (const w of items) {
    if (w > 0 && rest >= w) {
      plates.push(round2(w / 100));
      rest -= w;
    }
  }
  return rest === 0 ? plates : null;
}

/** Rebuild the fewest-plates solution from the knapsack table. */
function fewest(side: number, items: number[], used: Uint8Array[]): number[] {
  const plates: number[] = [];
  let s = side;
  for (let i = items.length - 1; i >= 0 && s > 0; i--) {
    if (used[i][s]) {
      plates.push(items[i] / 100);
      s -= items[i];
    }
  }
  return plates.sort((a, b) => b - a);
}
