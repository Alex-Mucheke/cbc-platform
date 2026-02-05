import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import quizzesRoutes from './routes/quizzes.js';
import writtenExamsRoutes from './routes/writtenExams.js';
import metaRoutes from './routes/meta.js';
import libraryRoutes from './routes/library.js';
import questionBankRoutes from './routes/questionBank.js';
import adminRoutes from './routes/admin.js';
import engagementRoutes from './routes/engagement.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/written-exams', writtenExamsRoutes);
app.use('/api', metaRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/engagement', engagementRoutes);

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`CBC backend running at http://localhost:${PORT}`);
});
