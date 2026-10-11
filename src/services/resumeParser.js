import pdf from 'pdf-parse/lib/pdf-parse.js';
import { SKILLS } from '../data/skills.js';

// Other ways people write a skill. 'go' is matched only through its alias,
// because the plain word "go" appears in normal sentences.
const ALIASES = {
  javascript: ['es6'],
  'node.js': ['nodejs', 'node js'],
  react: ['reactjs', 'react.js', 'react js'],
  'next.js': ['nextjs', 'next js'],
  vue: ['vuejs', 'vue.js'],
  nestjs: ['nest.js'],
  express: ['expressjs', 'express.js'],
  'rest api': ['rest apis', 'restful api', 'restful apis', 'restful'],
  mongodb: ['mongo', 'mongo db'],
  postgresql: ['postgres'],
  'tailwind css': ['tailwind', 'tailwindcss'],
  html: ['html5'],
  css: ['css3'],
  'c#': ['csharp'],
  '.net': ['dotnet'],
  go: ['golang'],
  aws: ['amazon web services'],
  gcp: ['google cloud'],
  kubernetes: ['k8s'],
  'ci/cd': ['cicd', 'ci cd'],
  'github actions': ['github action'],
  'unit testing': ['unit tests'],
  'scikit-learn': ['sklearn'],
  nlp: ['natural language processing'],
};

const ALIAS_ONLY = new Set(['go']);

// Stack names that stand for several skills.
// Only expanded in job descriptions, not in resumes.
const BUNDLES = {
  mern: ['mongodb', 'express', 'react', 'node.js'],
  mevn: ['mongodb', 'express', 'vue', 'node.js'],
  pern: ['postgresql', 'express', 'react', 'node.js'],
  'mean stack': ['mongodb', 'express', 'angular', 'node.js'],
};

function invalidPdfError() {
  const err = new Error(
    'This file is not a valid PDF. Export your resume as a PDF and try again.'
  );
  err.code = 'INVALID_PDF';
  return err;
}

/**
 * Extract raw text from a PDF buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(buffer) {
  // Real PDFs contain "%PDF-" near the start. Catches renamed HTML/other files.
  if (!buffer.subarray(0, 1024).includes('%PDF-')) {
    throw invalidPdfError();
  }

  let data;
  try {
    data = await pdf(buffer);
  } catch {
    throw invalidPdfError();
  }
  return (data.text || '').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasTerm(text, term) {
  const re = new RegExp(
    `(?<![a-z0-9+#])${escapeRegExp(term)}(?![a-z0-9+#])(?!\\.[a-z0-9])`,
    'i'
  );
  return re.test(text);
}

function termsFor(skill) {
  const aliases = ALIASES[skill] || [];
  return ALIAS_ONLY.has(skill) ? aliases : [skill, ...aliases];
}

/**
 * Find which known skills appear in the given text.
 * @param {string} text
 * @param {{ expandBundles?: boolean }} [options]
 * @returns {string[]}
 */
export function findSkills(text, { expandBundles = false } = {}) {
  if (!text) return [];
  const lower = text.toLowerCase();

  const found = new Set(
    SKILLS.filter((skill) => termsFor(skill).some((t) => hasTerm(lower, t)))
  );

  if (expandBundles) {
    for (const [name, skills] of Object.entries(BUNDLES)) {
      if (hasTerm(lower, name)) {
        skills.forEach((s) => SKILLS.includes(s) && found.add(s));
      }
    }
  }

  return SKILLS.filter((s) => found.has(s));
}

/**
 * Mock scoring engine.
 * Compares skills found in the resume against skills required by the JD.
 * The real AI comparison will plug in here later.
 *
 * @param {string} resumeText
 * @param {string} jdText
 */
export function analyzeResume(resumeText, jdText) {
  const resumeSkills = findSkills(resumeText);
  const requiredSkills = findSkills(jdText, { expandBundles: true });

  const resumeSet = new Set(resumeSkills);
  const matchedSkills = requiredSkills.filter((s) => resumeSet.has(s));
  const missingSkills = requiredSkills.filter((s) => !resumeSet.has(s));

  const score =
    requiredSkills.length === 0
      ? 0
      : Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    score,
    matchedSkills,
    missingSkills,
    resumeSkills,
    requiredSkills,
  };
}