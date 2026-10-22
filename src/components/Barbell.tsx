import type { ReactNode } from "react";
import { plateLook } from "@/lib/gym";
import type { Unit } from "@/lib/plates";

const SLEEVE = 132;
const GAP = 2;

type Props = {
  /** Plates on one side, heaviest first (nearest the collar). */
  perSide: number[];
  unit: Unit;
  label: string;
  /** Header row above the drawing — normal flow, never overlapping the plates. */
  header?: ReactNode;
};

/** Both sleeves, mirrored. Plates shrink in width if a sleeve gets too full. */
export function Barbell({ perSide, unit, label, header }: Props) {
  const looks = perSide.map((w) => plateLook(unit, w));
  const width =
    looks.reduce((sum, p) => sum + p.w, 0) + GAP * Math.max(0, looks.length - 1);
  const scale = width > SLEEVE ? SLEEVE / width : 1;

  const plates = looks.map((p, i) => (
    <div
      key={i}
      className="barbell__plate"
      style={{ width: p.w * scale, height: p.h, background: p.color }}
    />
  ));

  return (
    <section className="barbell-card" aria-label="Barbell">
      {header && <div className="barbell-card__header">{header}</div>}
      <div role="img" aria-label={label} className="barbell-card__drawing">
        <div className="barbell__sleeve barbell__sleeve--left">{plates}</div>
        <div className="barbell__collar" />
        <div className="barbell__shaft" />
        <div className="barbell__collar" />
        <div className="barbell__sleeve">{plates}</div>
      </div>
    </section>
  );
}
