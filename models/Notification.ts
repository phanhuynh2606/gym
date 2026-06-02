import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        "reminder_workout",
        "reminder_todo",
        "reminder_metrics",
        "streak_milestone",
        "monthly_review_ready",
        "achievement_unlocked",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: { type: String },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    dedupeKey: { type: String, index: true },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } },
);

export type NotificationDocument = InferSchemaType<typeof NotificationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const NotificationModel: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument>) ??
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);
