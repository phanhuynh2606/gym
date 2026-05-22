import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    displayName: { type: String },
    gender: { type: String, enum: ["male", "female"] },
    goal: {
      type: String,
      enum: ["weight_loss", "muscle_gain", "toning", "strength"],
    },
    activePlanSlug: { type: String },
    activePlanStartedAt: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    favoriteExerciseSlugs: [{ type: String, default: [] }],
    favoritePlanSlugs: [{ type: String, default: [] }],
    // Onboarding (PR #7) — captured from the first-run wizard. Used by the AI
    // coach (PR #8) for personalised plan suggestions and by /tien-do to
    // render weight-goal progress.
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
    equipment: [{ type: String, default: [] }],
    heightCm: { type: Number },
    currentWeightKg: { type: Number },
    targetWeightKg: { type: Number },
    birthYear: { type: Number },
    onboardingCompletedAt: { type: Date },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", UserSchema);
