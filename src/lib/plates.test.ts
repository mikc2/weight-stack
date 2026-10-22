import { describe, expect, it } from "vitest";
import { BAR_TYPES, stepPairs } from "./gym";
import {
  convert,
  DEFAULT_BAR,
  DEFAULT_INVENTORY,
  planLoad,
  type LoadInput,
  type PlateStock,
  type Unit,
} from "./plates";

function plan(typed: number, typedUnit: Unit, plateUnit: Unit, extra?: Partial<LoadInput>) {
  return planLoad({
    typed,
    typedUnit,
    plateUnit,
    bar: DEFAULT_BAR[plateUnit],
    collars: false,
    inventory: DEFAULT_INVENTORY[plateUnit],
    ...extra,
  });
}

describe("planLoad — handoff test table", () => {
  it.each([
    { typed: 100, unit: "kg", perSide: [25, 15], loaded: 100 },
    { typed: 140, unit: "kg", perSide: [25, 25, 10], loaded: 140 },
    { typed: 225, unit: "lb", perSide: [45, 45], loaded: 225 },
    { typed: 315, unit: "lb", perSide: [45, 45, 45], loaded: 315 },
  ] as const)("$typed $unit → exact $perSide", ({ typed, unit, perSide, loaded }) => {
    expect(plan(typed, unit, unit)).toMatchObject({
      status: "exact",
      perSide,
      loaded,
    });
  });

  it("102 kg → closest 102.5 kg (25, 15, 1.25)", () => {
    expect(plan(102, "kg", "kg")).toMatchObject({
      status: "closest",
      reason: "rounded",
      perSide: [25, 15, 1.25],
      loaded: 102.5,
    });
  });

  it("100 kg on lb plates → 220 lb ≈ 99.8 kg", () => {
    const result = plan(100, "kg", "lb");
    expect(result).toMatchObject({ perSide: [45, 35, 5, 2.5], loaded: 220 });
    if (result.status === "below-bar") throw new Error("unexpected");
    expect(result.loadedTyped).toBeCloseTo(99.79, 2);
    expect(result.diffTyped).toBeCloseTo(-0.21, 2);
  });

  it("15 kg → below bar weight", () => {
    expect(plan(15, "kg", "kg")).toEqual({
      status: "below-bar",
      target: 15,
      minimum: 20,
    });
  });
});

describe("planLoad — edge cases", () => {
  it("falls back to DP when greedy misses (80 kg, 1×20 + 2×15 pairs)", () => {
    const result = plan(80, "kg", "kg", {
      inventory: [
        { weight: 20, pairs: 1 },
        { weight: 15, pairs: 2 },
      ],
    });
    expect(result).toMatchObject({ status: "exact", perSide: [15, 15] });
  });

  it("says when the inventory runs out", () => {
    expect(plan(500, "kg", "kg")).toMatchObject({
      status: "closest",
      reason: "inventory",
      loaded: 20 + 2 * (2 * 25 + 4 * 20 + 2 * 15 + 2 * 10 + 2 * 5 + 2 * 2.5 + 2 * 1.25),
    });
  });

  it("counts 2.5 kg collars on each side", () => {
    expect(plan(75, "kg", "kg", { collars: true })).toMatchObject({
      status: "exact",
      perSide: [25],
    });
    expect(plan(22, "kg", "kg", { collars: true })).toMatchObject({
      status: "below-bar",
      minimum: 25,
    });
  });

  it("skips plates with 0 pairs", () => {
    const inventory = DEFAULT_INVENTORY.kg.map((p) =>
      p.weight === 25 ? { ...p, pairs: 0 } : p,
    );
    expect(plan(100, "kg", "kg", { inventory }).status).toBe("exact");
    expect(plan(100, "kg", "kg", { inventory })).toMatchObject({ perSide: [20, 20] });
  });

  it("loads just the bar at bar weight", () => {
    expect(plan(20, "kg", "kg")).toMatchObject({ status: "exact", perSide: [], loaded: 20 });
  });

  it("converts kg ⇄ lb", () => {
    expect(convert(100, "kg", "lb")).toBeCloseTo(220.462, 3);
    expect(convert(convert(57.5, "kg", "lb"), "lb", "kg")).toBeCloseTo(57.5, 10);
    expect(convert(45, "lb", "lb")).toBe(45);
  });
});

describe("planLoad — bar types and unlimited plates", () => {
  const machine = (unit: Unit) => ({ bar: BAR_TYPES.machine[unit] });
  const only25 = (pairs: PlateStock["pairs"]): PlateStock[] =>
    DEFAULT_INVENTORY.kg.map((p) => ({ ...p, pairs: p.weight === 25 ? pairs : 0 }));

  it("machine (0 kg), 100 kg → 25, 25 exact", () => {
    expect(plan(100, "kg", "kg", machine("kg"))).toMatchObject({
      status: "exact",
      perSide: [25, 25],
    });
  });

  it("machine (0 lb), 60 lb → 25, 5 exact", () => {
    expect(plan(60, "lb", "lb", machine("lb"))).toMatchObject({
      status: "exact",
      perSide: [25, 5],
    });
  });

  it("machine, 0 kg typed → no plates, not below-bar", () => {
    expect(plan(0, "kg", "kg", machine("kg"))).toMatchObject({
      status: "exact",
      perSide: [],
      loaded: 0,
    });
  });

  it("every kg plate unlimited, 500 kg → exact, never inventory", () => {
    const inventory = DEFAULT_INVENTORY.kg.map((p) => ({ ...p, pairs: "unlimited" as const }));
    const result = plan(500, "kg", "kg", { inventory });
    expect(result).toMatchObject({ status: "exact", loaded: 500 });
    expect(result).not.toHaveProperty("reason", "inventory");
  });

  it("every kg plate unlimited, 1,000,000 kg → returns quickly, not enough plates", () => {
    const inventory = DEFAULT_INVENTORY.kg.map((p) => ({ ...p, pairs: "unlimited" as const }));
    const start = performance.now();
    const result = plan(1_000_000, "kg", "kg", { inventory });
    expect(performance.now() - start).toBeLessThan(500);
    expect(result).toMatchObject({ status: "closest", reason: "inventory" });
  });

  it("25 kg unlimited, rest 0, 120 kg → 25, 25 exact", () => {
    expect(plan(120, "kg", "kg", { inventory: only25("unlimited") })).toMatchObject({
      status: "exact",
      perSide: [25, 25],
    });
  });

  it("25 kg = 1 pair, rest 0, 120 kg → inventory, loaded 70", () => {
    expect(plan(120, "kg", "kg", { inventory: only25(1) })).toMatchObject({
      status: "closest",
      reason: "inventory",
      loaded: 70,
    });
  });
});

describe("stepPairs", () => {
  it.each([
    { from: 0, dir: 1, to: "unlimited" },
    { from: "unlimited", dir: 1, to: 1 },
    { from: 1, dir: -1, to: "unlimited" },
    { from: "unlimited", dir: -1, to: 0 },
    { from: 10, dir: 1, to: 10 },
    { from: 0, dir: -1, to: 0 },
  ] as const)("$from, $dir → $to", ({ from, dir, to }) => {
    expect(stepPairs(from, dir)).toBe(to);
  });
});
