import { Router } from 'express';
import multer from 'multer';
import { analyze, history } from '../controllers/resumeController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      return cb(null, true);
    }
    cb(new Error('Only PDF files are allowed.'));
  },
});

router.post('/analyze', upload.single('resume'), analyze);
router.get('/history', history);

export default router;
