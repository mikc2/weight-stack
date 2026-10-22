import { BottomSheet } from "@/components/BottomSheet";
import { BAR_TYPES, type BarType, type BarTypeId } from "@/lib/gym";

type Props = {
  open: boolean;
  onClose: () => void;
  value: BarTypeId;
  onChange: (id: BarTypeId) => void;
};

const GROUPS: { group: BarType["group"]; heading: string }[] = [
  { group: "barbell", heading: "Barbells" },
  { group: "machine", heading: "Machine · no starting weight" },
];

/** Radio list of bar types. Picking one selects it and closes the sheet. */
export function BarTypeSheet({ open, onClose, value, onChange }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Bar type">
      <div role="radiogroup" aria-label="Bar type" className="options">
        {GROUPS.map(({ group, heading }) => (
          <div key={group} className="options__group">
            <h3 className="options__heading">{heading}</h3>
            {Object.values(BAR_TYPES)
              .filter((b) => b.group === group)
              .map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={b.id === value}
                  className="option"
                  onClick={() => {
                    onChange(b.id);
                    onClose();
                  }}
                >
                  {group === "machine" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="option__icon">
                      <path d="M2 12h20M5 7v10M19 7v10" />
                      <rect x="9" y="8" width="6" height="8" rx="1" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="option__icon">
                      <path d="M2 12h20M6 7v10M9 5v14M15 5v14M18 7v10" />
                    </svg>
                  )}
                  <span className="option__text">
                    <span className="option__name">{b.name}</span>
                    <span className="muted-small">{b.detail}</span>
                  </span>
                  {b.id === value && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="option__check">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  )}
                </button>
              ))}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
