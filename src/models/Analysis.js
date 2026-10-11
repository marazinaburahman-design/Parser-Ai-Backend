import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    jobDescription: { type: String, default: '' },
    score: { type: Number, required: true },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    resumeSkills: { type: [String], default: [] },
    extractedText: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Analysis', analysisSchema);
