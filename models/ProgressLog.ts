import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ExerciseSetLogSchema = new Schema(
  {
    setNumber: { type: Number, required: true },
    reps: { type: Number, required: true },
    weight: { type: Number },
    rpe: { type: Number, min: 1, max: 10 },
    notes: { type: String },
  },
  { _id: false },
);

const ExerciseLogSchema = new Schema(
  {
    exerciseSlug: { type: String, required: true },
    sets: { type: [ExerciseSetLogSchema], default: [] },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const ProgressLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    planSlug: { type: String },
    sessionId: { type: String },
    exerciseLogs: { type: [ExerciseLogSchema], default: [] },
    totalVolume: { type: Number, default: 0 },
    durationMinutes: { type: Number },
    note: { type: String },
  },
  { timestamps: true },
);

ProgressLogSchema.index({ userId: 1, date: -1 });

export type ProgressLogDocument = InferSchemaType<typeof ProgressLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProgressLogModel: Model<ProgressLogDocument> =
  (mongoose.models.ProgressLog as Model<ProgressLogDocument>) ??
  mongoose.model<ProgressLogDocument>("ProgressLog", ProgressLogSchema);
