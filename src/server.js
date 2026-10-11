import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import resumeRoutes from './routes/resumeRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'resume-parser-backend' });
});

// Ensure the database is connected before handling API requests.
// The connection is cached, so this is cheap on warm invocations.
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/resume', resumeRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err) {
    console.error('Unhandled error:', err.message);
    return res.status(400).json({ error: err.message || 'Bad request' });
  }
  next();
});

// Local development runs a listener. On Vercel the default export below is
// used directly as the serverless handler.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    });
}

export default app;
