import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoachChat } from "@/components/coach/CoachChat";
import { buildCoachContext, renderContextAsParagraph } from "@/lib/coach-context";
import { isLlmConfigured } from "@/lib/coach";
import { connectMongoDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/users";
import { CoachMessageModel } from "@/models/CoachMessage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HLV AI",
  description:
    "Huấn luyện viên ảo trả lời câu hỏi tập gym, gợi ý điều chỉnh giáo án, phân tích tiến độ — dựa trên dữ liệu cá nhân của bạn.",
};

const STARTER_PROMPTS = [
  "Hôm qua tôi lỡ buổi rồi, giờ làm sao?",
  "Đề xuất bài thay thế cho squat (đau gối nhẹ).",
  "Tôi nên ăn bao nhiêu protein mỗi ngày?",
  "30 ngày qua tập rồi mà cân không giảm.",
  "Plateau rồi, có nên đổi giáo án không?",
];

export default async function CoachPage() {
  const user = await getOrCreateMongoUser();
  if (!user) redirect("/sign-in?redirect_url=/coach");

  await connectMongoDB();

  const [historyDocs, context] = await Promise.all([
    // Take the *most recent* 50 messages, then put them back in chronological
    // order for display. Sorting ascending + limit(50) would silently truncate
    // the conversation to its oldest turns once a user crosses 50 messages.
    CoachMessageModel.find({ userId: user.clerkId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .then((docs) => docs.reverse()),
    buildCoachContext(user),
  ]);

  const history = historyDocs
    .filter((d) => d.role === "user" || d.role === "assistant")
    .map((d) => ({
      id: String(d._id),
      role: d.role as "user" | "assistant",
      content: d.content,
      source: d.source,
      createdAt: d.createdAt.toISOString(),
    }));

  const summaryText = renderContextAsParagraph(context);

  return (
    <CoachChat
      history={history}
      starterPrompts={STARTER_PROMPTS}
      llmConfigured={isLlmConfigured()}
      contextSummary={summaryText}
      profile={context.profile}
      progress={context.progress}
      plan={context.plan}
    />
  );
}
