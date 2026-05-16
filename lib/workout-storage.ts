import type {
  ExerciseProgress,
  SessionCompletion,
  SessionProgress,
  SetLog,
} from "@/types";

const ACTIVE_PREFIX = "gym:active";
const COMPLETIONS_PREFIX = "gym:completions";

const EMPTY_COMPLETIONS: SessionCompletion[] = Object.freeze(
  [] as SessionCompletion[],
) as SessionCompletion[];

const listeners = new Set<() => void>();

type SnapshotEntry = { raw: string | null; value: unknown };
const snapshotCache = new Map<string, SnapshotEntry>();

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function activeKey(planSlug: string, sessionId: string): string {
  return `${ACTIVE_PREFIX}:${planSlug}:${sessionId}`;
}

function completionsKey(planSlug: string): string {
  return `${COMPLETIONS_PREFIX}:${planSlug}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function notify(): void {
  for (const fn of Array.from(listeners)) fn();
}

function readSnapshot<T>(
  key: string,
  fallback: T,
  parser: (raw: string) => T,
): T {
  if (!isBrowser()) return fallback;
  const raw = window.localStorage.getItem(key);
  const prior = snapshotCache.get(key);
  if (prior && prior.raw === raw) return prior.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = parser(raw);
    } catch {
      value = fallback;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

function writeSnapshot<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    const raw = JSON.stringify(value);
    window.localStorage.setItem(key, raw);
    snapshotCache.set(key, { raw, value });
  } catch {
    // Quota exceeded or storage disabled — fail silently.
  }
}

function removeSnapshot(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
  snapshotCache.set(key, { raw: null, value: null });
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key === null) {
    snapshotCache.clear();
    notify();
    return;
  }
  if (
    event.key.startsWith(`${ACTIVE_PREFIX}:`) ||
    event.key.startsWith(`${COMPLETIONS_PREFIX}:`)
  ) {
    snapshotCache.delete(event.key);
    notify();
  }
}

export function subscribeWorkoutStorage(callback: () => void): () => void {
  listeners.add(callback);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

export function loadSessionProgress(
  planSlug: string,
  sessionId: string,
): SessionProgress | null {
  return readSnapshot<SessionProgress | null>(
    activeKey(planSlug, sessionId),
    null,
    (raw) => JSON.parse(raw) as SessionProgress,
  );
}

export function ensureSessionProgress(
  planSlug: string,
  sessionId: string,
): SessionProgress {
  const existing = loadSessionProgress(planSlug, sessionId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const fresh: SessionProgress = {
    planSlug,
    sessionId,
    date: todayIso(),
    startedAt: now,
    exercises: {},
  };
  writeSnapshot(activeKey(planSlug, sessionId), fresh);
  notify();
  return fresh;
}

export function saveExerciseProgress(
  planSlug: string,
  sessionId: string,
  exerciseSlug: string,
  sets: SetLog[],
): SessionProgress {
  const progress = ensureSessionProgress(planSlug, sessionId);
  const next: ExerciseProgress = {
    exerciseSlug,
    sets,
    updatedAt: new Date().toISOString(),
  };
  const updated: SessionProgress = {
    ...progress,
    exercises: { ...progress.exercises, [exerciseSlug]: next },
  };
  writeSnapshot(activeKey(planSlug, sessionId), updated);
  notify();
  return updated;
}

export function clearSessionProgress(
  planSlug: string,
  sessionId: string,
): void {
  removeSnapshot(activeKey(planSlug, sessionId));
  notify();
}

export function loadCompletions(planSlug: string): SessionCompletion[] {
  return readSnapshot<SessionCompletion[]>(
    completionsKey(planSlug),
    EMPTY_COMPLETIONS,
    (raw) => {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? (parsed as SessionCompletion[])
        : EMPTY_COMPLETIONS;
    },
  );
}

export function recordCompletion(
  entry: SessionCompletion,
): SessionCompletion[] {
  const existing = loadCompletions(entry.planSlug);
  const filtered = existing.filter(
    (c) => !(c.sessionId === entry.sessionId && c.date === entry.date),
  );
  const next = [...filtered, entry].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  writeSnapshot(completionsKey(entry.planSlug), next);
  notify();
  return next;
}

export function completionMap(
  completions: SessionCompletion[],
): Map<string, SessionCompletion> {
  const map = new Map<string, SessionCompletion>();
  for (const c of completions) {
    map.set(`${c.date}:${c.sessionId}`, c);
  }
  return map;
}

export function getTodayIso(): string {
  return todayIso();
}

export function buildInitialSets(count: number): SetLog[] {
  return Array.from({ length: count }, (_, i) => ({
    setIndex: i,
    completed: false,
  }));
}
