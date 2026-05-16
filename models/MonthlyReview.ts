import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const MonthlyReviewSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    month: { type: String, required: true },
    stats: {
      totalSessions: { type: Number, default: 0 },
      plannedSessions: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      totalVolume: { type: Number, default: 0 },
      avgSleepHours: { type: Number },
      avgWaterLiters: { type: Number },
      avgEnergyLevel: { type: Number },
      bodyWeightStart: { type: Number },
      bodyWeightEnd: { type: Number },
    },
    summaryText: { type: String, default: "" },
    achievements: [{ type: String, default: [] }],
    suggestions: [{ type: String, default: [] }],
    suggestedNextPlanSlug: { type: String },
  },
  { timestamps: true },
);

MonthlyReviewSchema.index({ userId: 1, month: 1 }, { unique: true });

export type MonthlyReviewDocument = InferSchemaType<
  typeof MonthlyReviewSchema
> & { _id: mongoose.Types.ObjectId };

export const MonthlyReviewModel: Model<MonthlyReviewDocument> =
  (mongoose.models.MonthlyReview as Model<MonthlyReviewDocument>) ??
  mongoose.model<MonthlyReviewDocument>("MonthlyReview", MonthlyReviewSchema);
