import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const DailyTaskSchema = new Schema(
  {
    taskId: { type: String, required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["workout", "nutrition", "recovery", "habit"],
      required: true,
    },
    completed: { type: Boolean, default: false },
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const DailyTodoSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    planSlug: { type: String },
    planDayIndex: { type: Number },
    type: {
      type: String,
      enum: ["training", "rest", "recovery"],
      required: true,
    },
    title: { type: String, required: true },
    tasks: { type: [DailyTaskSchema], default: [] },
    waterLiters: { type: Number },
    sleepHours: { type: Number },
    steps: { type: Number },
    bodyWeight: { type: Number },
    mood: { type: String, enum: ["bad", "normal", "good", "great"] },
    energyLevel: { type: Number, min: 1, max: 5 },
    completionRate: { type: Number, default: 0 },
    note: { type: String },
  },
  { timestamps: true },
);

DailyTodoSchema.index({ userId: 1, date: 1 }, { unique: true });

export type DailyTodoDocument = InferSchemaType<typeof DailyTodoSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DailyTodoModel: Model<DailyTodoDocument> =
  (mongoose.models.DailyTodo as Model<DailyTodoDocument>) ??
  mongoose.model<DailyTodoDocument>("DailyTodo", DailyTodoSchema);
