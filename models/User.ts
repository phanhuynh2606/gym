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
    // Reminder preferences (PR #9). Defaults applied at read time in
    // `lib/users.ts` so that missing documents still get sensible values.
    reminderEnabled: { type: Boolean, default: true },
    reminderHour: { type: Number, min: 0, max: 23, default: 18 },
    reminderEmailEnabled: { type: Boolean, default: false },
    timezoneOffsetMinutes: { type: Number, default: 420 },
    // Social profile (PR #10). Public profiles are addressable at
    // `/u/<profileSlug>`. Visibility defaults to "private" so users opt in
    // explicitly. `profileSlug` is unique among documents that actually
    // have one (partial filter expression on the index below).
    profileSlug: { type: String },
    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    profileBio: { type: String, maxlength: 280 },
    // Gamification (PR #11). Stores the ids of achievements the user has
    // unlocked, plus when, so notifications fire exactly once per badge and
    // profiles can show an "earned at" date.
    unlockedAchievements: [
      new Schema(
        {
          id: { type: String, required: true },
          unlockedAt: { type: Date, default: Date.now },
        },
        { _id: false },
      ),
    ],
  },
  { timestamps: true },
);

UserSchema.index(
  { profileSlug: 1 },
  {
    unique: true,
    partialFilterExpression: { profileSlug: { $type: "string" } },
  },
);
UserSchema.index({ profileVisibility: 1 });

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", UserSchema);
