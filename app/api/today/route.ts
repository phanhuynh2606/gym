import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectMongoDB } from "@/lib/mongodb";
import { today } from "@/lib/daily-todo-template";
import { serializeDailyTodo } from "@/lib/serializers";
import { getOrCreateMongoUser } from "@/lib/users";
import { DailyTodoModel } from "@/models/DailyTodo";
import { getPlanBySlug } from "@/server/seed/workout-plans";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await getOrCreateMongoUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectMongoDB();
  const date = today();
  const doc = await DailyTodoModel.findOne({ userId: user.clerkId, date });
  const todo = doc ? serializeDailyTodo(doc) : null;

  const activePlanSlug = user.activePlanSlug;
  const plan = activePlanSlug ? getPlanBySlug(activePlanSlug) : undefined;
  const session =
    plan && todo?.planDayIndex !== null && todo?.planDayIndex !== undefined
      ? (plan.sessions.find((s) => s.dayIndex === todo.planDayIndex) ?? null)
      : null;

  return NextResponse.json({
    date,
    user: {
      clerkId: user.clerkId,
      displayName: user.displayName,
      activePlanSlug: user.activePlanSlug,
    },
    todo,
    session: session
      ? {
          id: session.id,
          title: session.title,
          dayIndex: session.dayIndex,
          focus: session.focus,
          numExercises: session.exercises.length,
        }
      : null,
  });
}
