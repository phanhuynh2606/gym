"use server";

import type { SetLog } from "@/types";

export type LogExercisePayload = {
  planSlug: string;
  sessionId: string;
  exerciseSlug: string;
  sets: SetLog[];
  date: string;
};

export type LogExerciseResult = {
  ok: true;
  persistedAt: string;
  echo: LogExercisePayload;
};

export async function logExerciseSet(
  payload: LogExercisePayload,
): Promise<LogExerciseResult> {
  // Stub: PR #3 will persist this to MongoDB once Clerk auth is wired up and
  // the user is resolved on the server. For now we acknowledge the payload so
  // client UI can show a sync indicator without crashing on missing DB calls.
  return {
    ok: true,
    persistedAt: new Date().toISOString(),
    echo: payload,
  };
}

export type CompleteSessionPayload = {
  planSlug: string;
  sessionId: string;
  dayIndex: number;
  date: string;
};

export type CompleteSessionResult = {
  ok: true;
  persistedAt: string;
};

export async function completeWorkoutSession(
  payload: CompleteSessionPayload,
): Promise<CompleteSessionResult> {
  // Stub: see logExerciseSet — PR #3 hooks this into DailyTodo + ProgressLog.
  void payload;
  return {
    ok: true,
    persistedAt: new Date().toISOString(),
  };
}
