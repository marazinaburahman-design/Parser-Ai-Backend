import Analysis from '../models/Analysis.js';
import {
  extractTextFromPdf,
  analyzeResume,
} from '../services/resumeParser.js';

/**
 * POST /api/resume/analyze
 * multipart/form-data -> resume (PDF), jobDescription (string)
 */
export async function analyze(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'A resume PDF file is required.' });
    }

    const jobDescription = (req.body.jobDescription || '').trim();
    if (!jobDescription) {
      return res
        .status(400)
        .json({ error: 'A job description is required for comparison.' });
    }

    let resumeText;
    try {
      resumeText = await extractTextFromPdf(req.file.buffer);
    } catch (err) {
      if (err.code === 'INVALID_PDF') {
        return res.status(422).json({ error: err.message });
      }
      throw err;
    }

    if (!resumeText) {
      return res.status(422).json({
        error:
          'Could not extract any text from the PDF. It may be a scanned image.',
      });
    }

    const { score, matchedSkills, missingSkills, resumeSkills, requiredSkills } =
      analyzeResume(resumeText, jobDescription);

    if (requiredSkills.length === 0) {
      return res.status(422).json({
        error:
          'No known skills found in the job description. List technologies such as React, Node.js or MongoDB.',
      });
    }

    // A database problem should not lose the analysis the user waited for.
    let savedId = null;
    try {
      const saved = await Analysis.create({
        fileName: req.file.originalname,
        jobDescription,
        score,
        matchedSkills,
        missingSkills,
        resumeSkills,
        extractedText: resumeText,
      });
      savedId = saved._id;
    } catch (dbErr) {
      console.error('Could not save analysis:', dbErr.message);
    }

    return res.status(200).json({
      id: savedId,
      fileName: req.file.originalname,
      score,
      matchedSkills,
      missingSkills,
      resumeSkills,
    });
  } catch (err) {
    console.error('analyze error:', err);
    return res.status(500).json({ error: 'Failed to analyze the resume.' });
  }
}

/**
 * GET /api/resume/history
 */
export async function history(req, res) {
  try {
    const items = await Analysis.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-extractedText -jobDescription');
    return res.json(items);
  } catch (err) {
    console.error('history error:', err);
    return res.status(500).json({ error: 'Failed to load history.' });
  }
}