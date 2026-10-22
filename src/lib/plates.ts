export type Unit = "kg" | "lb";

/** Pairs of one plate size. "unlimited" = no cap (public gym). JSON can't store Infinity. */
export type PlateStock = { weight: number; pairs: number | "unlimited" };

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

/** "Unlimited" pairs per plate size: 20 × 25 kg is 1000 kg per side, far past any real lift. */
export const MAX_UNLIMITED_PAIRS = 20;

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
  // A machine starts at 0, so nothing is ever below its minimum.
  if (minimum > 0 && target < minimum - 0.005) {
    return { status: "below-bar", target, minimum };
  }

  const sideTarget = ((target - minimum) / 2) * 100;

  // Plate sizes in cents, heaviest first, with the pairs we may use. An
  // unlimited size never needs more than floor(sideTarget / w) + 1 pairs:
  // with one more, dropping a plate would get closer to the target. It is
  // also capped at MAX_UNLIMITED_PAIRS so a huge typed weight can't blow up
  // the table below.
  const stock = inventory
    .map((p) => {
      const w = toCents(p.weight);
      const count =
        p.pairs === "unlimited"
          ? Math.min(
              MAX_UNLIMITED_PAIRS,
              Math.floor(Math.max(0, sideTarget) / Math.max(1, w)) + 1,
            )
          : Math.max(0, p.pairs);
      return { w, count };
    })
    .filter((p) => p.w > 0 && p.count > 0)
    .sort((a, b) => b.w - a.w);

  // Split each count into bundles of 1, 2, 4, … pairs. Every count from 0 to
  // the total is still reachable, with far fewer rows than one per pair.
  const items: Bundle[] = stock.flatMap(({ w, count }) => {
    const bundles: Bundle[] = [];
    for (let n = 1; count > 0; n *= 2) {
      const take = Math.min(n, count);
      bundles.push({ w, n: take });
      count -= take;
    }
    return bundles;
  });

  // A sum above sideTarget + the heaviest plate is never the closest: dropping
  // a plate gets nearer. So the table can stop there.
  const maxSide = items.reduce((sum, b) => sum + b.w * b.n, 0);
  const limit = Math.min(maxSide, Math.max(0, Math.ceil(sideTarget)) + (stock[0]?.w ?? 0));

  // 0/1 knapsack over per-side sums: best[s] = fewest plates to reach s.
  const best = new Array<number>(limit + 1).fill(Infinity);
  best[0] = 0;
  const used = items.map(() => new Uint8Array(limit + 1));
  items.forEach(({ w, n }, i) => {
    const size = w * n;
    for (let s = limit; s >= size; s--) {
      if (best[s - size] + n < best[s]) {
        best[s] = best[s - size] + n;
        used[i][s] = 1;
      }
    }
  });

  // Closest loadable per-side sum; a tie goes to the heavier one. For
  // standard sets this is "round to 2 × the smallest plate".
  let side = 0;
  for (let s = 0; s <= limit; s++) {
    if (best[s] === Infinity) continue;
    if (Math.abs(s - sideTarget) <= Math.abs(side - sideTarget)) side = s;
  }

  const perSide = greedy(side, stock) ?? fewest(side, items, used);
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

/** `n` pairs of a plate weighing `w` cents. */
type Bundle = { w: number; n: number };

/** Heaviest plate first. `stock` is already sorted descending. Null if it can't hit `side`. */
function greedy(side: number, stock: { w: number; count: number }[]): number[] | null {
  const plates: number[] = [];
  let rest = side;
  for (const { w, count } of stock) {
    const take = Math.min(count, Math.floor(rest / w));
    for (let k = 0; k < take; k++) plates.push(round2(w / 100));
    rest -= take * w;
  }
  return rest === 0 ? plates : null;
}

/** Rebuild the fewest-plates solution from the knapsack table. */
function fewest(side: number, items: Bundle[], used: Uint8Array[]): number[] {
  const plates: number[] = [];
  let s = side;
  for (let i = items.length - 1; i >= 0 && s > 0; i--) {
    if (used[i][s]) {
      const { w, n } = items[i];
      for (let k = 0; k < n; k++) plates.push(w / 100);
      s -= w * n;
    }
  }
  return plates.sort((a, b) => b - a);
}
