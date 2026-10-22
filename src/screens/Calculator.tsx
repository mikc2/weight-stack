import { Barbell } from "@/components/Barbell";
import { UnitToggle } from "@/components/Segmented";
import { fmt, fmt1, fmtDiff } from "@/lib/format";
import { BUMP_STEP, plateLook, QUICK_PICKS, type Settings } from "@/lib/gym";
import { convert, planLoad, type Unit } from "@/lib/plates";

type Props = {
  settings: Settings;
  onPlateUnit: (unit: Unit) => void;
  raw: string;
  onRaw: (raw: string) => void;
  typedUnit: Unit;
  onTypedUnit: (unit: Unit) => void;
};

type Status = { text: string; tone: "muted" | "exact" | "closest" | "error" };

export function Calculator({
  settings,
  onPlateUnit,
  raw,
  onRaw,
  typedUnit,
  onTypedUnit,
}: Props) {
  const pu = settings.plateUnit;
  const iu = typedUnit;
  const typed = parseFloat(raw);
  const valid = !isNaN(typed);
  const converting = pu !== iu;
  const bar = settings.bar[pu];

  const plan = valid
    ? planLoad({
        typed,
        typedUnit: iu,
        plateUnit: pu,
        bar,
        collars: settings.collars,
        inventory: settings.inventory[pu],
      })
    : null;
  const perSide = plan && plan.status !== "below-bar" ? plan.perSide : [];

  let status: Status = { text: "Enter a weight", tone: "muted" };
  if (plan?.status === "below-bar") {
    const back = converting ? ` ≈ ${fmt1(convert(plan.minimum, pu, iu))} ${iu}` : "";
    status = { text: `Below bar weight (${fmt(plan.minimum)} ${pu}${back})`, tone: "error" };
  } else if (plan?.reason === "inventory") {
    const back = converting ? ` ≈ ${fmt1(plan.loadedTyped)} ${iu}` : "";
    status = {
      text: `Not enough plates — closest: ${fmt(plan.loaded)} ${pu}${back}`,
      tone: "closest",
    };
  } else if (plan?.status === "exact" && converting) {
    status = {
      text: `✓ Load ${fmt(plan.loaded)} ${pu} ≈ ${fmt1(plan.loadedTyped)} ${iu} (${fmtDiff(plan.diffTyped)} ${iu})`,
      tone: "exact",
    };
  } else if (plan?.status === "exact") {
    const side = perSide.reduce((sum, w) => sum + w, 0);
    status = { text: `✓ Exact — ${fmt(side)} ${pu} each side`, tone: "exact" };
  } else if (plan && converting) {
    status = {
      text: `Closest you can load: ${fmt(plan.loaded)} ${pu} ≈ ${fmt1(plan.loadedTyped)} ${iu}`,
      tone: "closest",
    };
  } else if (plan) {
    status = { text: `Closest you can load: ${fmt(plan.loaded)} ${pu}`, tone: "closest" };
  }

  const groups: { plate: number; count: number }[] = [];
  for (const w of perSide) {
    const last = groups[groups.length - 1];
    if (last?.plate === w) last.count += 1;
    else groups.push({ plate: w, count: 1 });
  }

  const loadedLabel =
    plan && plan.status !== "below-bar" ? fmt(plan.loaded) : fmt(bar);

  function bump(dir: 1 | -1) {
    const step = BUMP_STEP[iu];
    const t = valid ? typed : 0;
    onRaw(fmt(Math.max(0, Math.round(t / step) * step + dir * step)));
  }

  function changeTypedUnit(unit: Unit) {
    if (unit === iu) return;
    // Convert what was typed, rounded to 0.5 like the design.
    if (valid) onRaw(fmt(Math.round(convert(typed, iu, unit) * 2) / 2));
    onTypedUnit(unit);
  }

  function onTargetFocus(e: React.FocusEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  }

  return (
    <div className="screen screen--calc">
      <header className="screen__header">
        <h1 className="title">Weight Stack</h1>
      </header>

      <Barbell
        perSide={perSide}
        unit={pu}
        label={`Barbell loaded to ${loadedLabel} ${pu}`}
        header={
          <>
            <span id="plates-label" className="eyebrow eyebrow--small">
              Gym plates
            </span>
            <UnitToggle value={pu} onChange={onPlateUnit} labelledBy="plates-label" dark />
          </>
        }
      />

      <section className="section">
        <div className="section__head">
          <h2 className="eyebrow">Each side · {pu}</h2>
          <span className="muted-small">
            Bar {fmt(bar)} {pu}
            {settings.collars ? " + collars" : ""}
          </span>
        </div>
        <div className="chips">
          {groups.map((g) => (
            <div key={g.plate} className="chip">
              <span
                aria-hidden="true"
                className="chip__swatch"
                style={{ background: plateLook(pu, g.plate).color }}
              />
              <span className="chip__text">
                {g.count} × {fmt(g.plate)}
              </span>
            </div>
          ))}
          {groups.length === 0 && <div className="chips__empty">No plates — just the bar</div>}
        </div>
      </section>

      <section className="target">
        <label htmlFor="target" className="eyebrow">
          Target weight
        </label>
        <div className="target__row">
          <button
            type="button"
            className="bump"
            aria-label="Decrease weight"
            onClick={() => bump(-1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14" />
            </svg>
          </button>
          <div className="target__box">
            <input
              id="target"
              className="target__input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={raw}
              onChange={(e) =>
                onRaw(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""))
              }
              onFocus={onTargetFocus}
            />
            <UnitToggle vertical value={iu} onChange={changeTypedUnit} label="Unit you type in" />
          </div>
          <button
            type="button"
            className="bump bump--accent"
            aria-label="Increase weight"
            onClick={() => bump(1)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14M12 5v14" />
            </svg>
          </button>
        </div>
        <div className="status" aria-live="polite">
          {converting && valid && (
            <div className="status__convert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h14l-4-4M20 16H6l4 4" />
              </svg>
              {fmt(typed)} {iu} = {fmt1(convert(typed, iu, pu))} {pu}
            </div>
          )}
          <div className={`status__text status__text--${status.tone}`}>{status.text}</div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="eyebrow">Quick picks · {iu}</h2>
        </div>
        <div className="quick">
          {QUICK_PICKS[iu].map((v) => (
            <button
              key={v}
              type="button"
              className="quick__pick"
              aria-pressed={valid && Math.abs(v - typed) < 1e-6}
              onClick={() => onRaw(String(v))}
            >
              {v}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
