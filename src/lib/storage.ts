import { useEffect, useState } from "react";

const PREFIX = "plate-loader:";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * useState that is saved to localStorage. Storage errors are ignored.
 * `migrate` fixes up a value saved by an older version.
 */
export function usePersistentState<T>(key: string, initial: T, migrate?: (saved: T) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return initial;
      let parsed = JSON.parse(raw) as T;
      // Backfill fields missing from an older saved shape with defaults.
      if (isPlainObject(initial) && isPlainObject(parsed)) {
        parsed = { ...initial, ...parsed } as T;
      }
      return migrate ? migrate(parsed) : parsed;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Private mode or full storage: keep working without saving.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
