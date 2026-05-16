import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SessionExerciseSchema = new Schema(
  {
    exerciseSlug: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: String, required: true },
    restSeconds: { type: Number, required: true },
    note: { type: String },
  },
  { _id: false },
);

const CardioBlockSchema = new Schema(
  {
    title: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    intensity: {
      type: String,
      enum: ["low", "moderate", "high"],
      required: true,
    },
    note: { type: String },
  },
  { _id: false },
);

const WorkoutSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    title: { type: String, required: true },
    dayIndex: { type: Number, required: true },
    focus: [{ type: String, required: true }],
    exercises: { type: [SessionExerciseSchema], default: [] },
    cardio: { type: CardioBlockSchema },
  },
  { _id: false },
);

const WorkoutPlanSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    targetUser: {
      type: String,
      enum: ["female_weight_loss", "male_beginner"],
      required: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    daysPerWeek: { type: Number, required: true },
    goal: { type: String, default: "" },
    description: { type: String, default: "" },
    sessions: { type: [WorkoutSessionSchema], default: [] },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type WorkoutPlanDocument = InferSchemaType<typeof WorkoutPlanSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const WorkoutPlanModel: Model<WorkoutPlanDocument> =
  (mongoose.models.WorkoutPlan as Model<WorkoutPlanDocument>) ??
  mongoose.model<WorkoutPlanDocument>("WorkoutPlan", WorkoutPlanSchema);
