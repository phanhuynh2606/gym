import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ExerciseSchema = new Schema(
  {
    nameVi: { type: String, required: true },
    nameEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    primaryMuscles: [{ type: String, required: true }],
    secondaryMuscles: [{ type: String, default: [] }],
    equipment: [{ type: String, required: true }],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    goalTags: [{ type: String, default: [] }],
    instructions: [{ type: String, default: [] }],
    commonMistakes: [{ type: String, default: [] }],
    tips: [{ type: String, default: [] }],
    imageUrl: { type: String },
    gifUrl: { type: String },
    videoUrl: { type: String },
    youtubeVideoId: { type: String },
    alternativeSlugs: [{ type: String, default: [] }],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ExerciseSchema.index({ primaryMuscles: 1 });
ExerciseSchema.index({ equipment: 1 });

export type ExerciseDocument = InferSchemaType<typeof ExerciseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ExerciseModel: Model<ExerciseDocument> =
  (mongoose.models.Exercise as Model<ExerciseDocument>) ??
  mongoose.model<ExerciseDocument>("Exercise", ExerciseSchema);
