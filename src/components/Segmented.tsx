import type { Unit } from "@/lib/plates";

type Props = {
  value: Unit;
  onChange: (unit: Unit) => void;
  vertical?: boolean;
  dark?: boolean;
} & ({ labelledBy: string } | { label: string });

/** kg / lb toggle. Each option is a real button with aria-pressed. */
export function UnitToggle({ value, onChange, vertical, dark, ...a11y }: Props) {
  const className = [
    "segmented",
    vertical && "segmented--vertical",
    dark && "segmented--dark",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      role="group"
      className={className}
      aria-labelledby={"labelledBy" in a11y ? a11y.labelledBy : undefined}
      aria-label={"label" in a11y ? a11y.label : undefined}
    >
      {(["kg", "lb"] as const).map((unit) => (
        <button
          key={unit}
          type="button"
          aria-pressed={value === unit}
          onClick={() => onChange(unit)}
        >
          {unit}
        </button>
      ))}
    </div>
  );
}
