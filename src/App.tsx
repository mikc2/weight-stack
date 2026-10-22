import { DEFAULT_SETTINGS, migrateSettings, type Settings } from "@/lib/gym";
import type { Unit } from "@/lib/plates";
import { usePersistentState } from "@/lib/storage";
import { Calculator } from "@/screens/Calculator";

function App() {
  const [settings, setSettings] = usePersistentState<Settings>(
    "settings",
    DEFAULT_SETTINGS,
    migrateSettings,
  );
  const [raw, setRaw] = usePersistentState("raw", "100");
  const [typedUnit, setTypedUnit] = usePersistentState<Unit>("typedUnit", "kg");

  return (
    <div className="app">
      <main className="app__main">
        <Calculator
          settings={settings}
          onSettings={setSettings}
          raw={raw}
          onRaw={setRaw}
          typedUnit={typedUnit}
          onTypedUnit={setTypedUnit}
        />
      </main>
    </div>
  );
}

export default App;
