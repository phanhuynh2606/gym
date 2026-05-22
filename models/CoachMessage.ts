import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Stored AI coach chat history per user. We keep both `user` and `assistant`
 * turns so the next call can replay context. `system` rows are reserved for
 * checkpoints we inject manually (e.g. "profile was updated").
 *
 * `source` tracks whether the assistant reply came from the LLM or the
 * deterministic fallback engine — useful for debugging and for the UI to
 * label fallback replies so the user knows they aren't talking to an LLM.
 */
const CoachMessageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    source: {
      type: String,
      enum: ["user", "llm", "fallback"],
      required: true,
    },
    model: { type: String },
  },
  { timestamps: true },
);

CoachMessageSchema.index({ userId: 1, createdAt: 1 });

export type CoachMessageDocument = InferSchemaType<typeof CoachMessageSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CoachMessageModel: Model<CoachMessageDocument> =
  (mongoose.models.CoachMessage as Model<CoachMessageDocument>) ??
  mongoose.model<CoachMessageDocument>("CoachMessage", CoachMessageSchema);
