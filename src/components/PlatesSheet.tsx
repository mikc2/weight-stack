import { BottomSheet } from "@/components/BottomSheet";
import { fmt } from "@/lib/format";
import { plateLook, stepPairs, type Settings } from "@/lib/gym";
import type { PlateStock } from "@/lib/plates";

type Props = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onSettings: (update: (s: Settings) => Settings) => void;
};

/** Pairs per plate for the current plate unit, plus the collars switch. Changes apply live. */
export function PlatesSheet({ open, onClose, settings, onSettings }: Props) {
  const pu = settings.plateUnit;

  function updatePlates(update: (plates: PlateStock[]) => PlateStock[]) {
    onSettings((s) => ({
      ...s,
      inventory: { ...s.inventory, [pu]: update(s.inventory[pu]) },
    }));
  }

  function step(weight: number, dir: 1 | -1) {
    updatePlates((plates) =>
      plates.map((p) => (p.weight === weight ? { ...p, pairs: stepPairs(p.pairs, dir) } : p)),
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="My plates"
      subtitle="Pairs you have · ∞ = unlimited"
    >
      <button
        type="button"
        className="outline-button"
        onClick={() =>
          updatePlates((plates) => plates.map((p) => ({ ...p, pairs: "unlimited" })))
        }
      >
        Public gym? Set all to unlimited (∞)
      </button>

      <ul className="plate-list">
        {settings.inventory[pu].map((p) => {
          const label = `${fmt(p.weight)} ${pu}`;
          return (
            <li
              key={p.weight}
              className={p.pairs === 0 ? "plate-row plate-row--off" : "plate-row"}
            >
              <span
                aria-hidden="true"
                className="plate-row__swatch"
                style={{ background: plateLook(pu, p.weight).color }}
              />
              <span className="plate-row__label">{label}</span>
              <button
                type="button"
                className="plate-row__step"
                aria-label={`Fewer ${label} pairs`}
                onClick={() => step(p.weight, -1)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <span className="plate-row__count" aria-live="polite">
                {p.pairs === "unlimited" ? "∞" : p.pairs}
              </span>
              <button
                type="button"
                className="plate-row__step"
                aria-label={`More ${label} pairs`}
                onClick={() => step(p.weight, 1)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 12h14M12 5v14" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="switch-row">
        <div className="switch-row__text">
          <span className="switch-row__label">Count collars</span>
          <span className="muted-small">
            {pu === "kg" ? "Adds 2.5 kg each side" : "Adds about 5.5 lb each side"}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.collars}
          aria-label="Count collars"
          className="switch"
          onClick={() => onSettings((s) => ({ ...s, collars: !s.collars }))}
        >
          <span className="switch__knob" />
        </button>
      </div>

      <button type="button" className="primary-button" onClick={onClose}>
        Done
      </button>
    </BottomSheet>
  );
}
