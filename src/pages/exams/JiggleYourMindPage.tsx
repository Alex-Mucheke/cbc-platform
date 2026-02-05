/**
 * Jiggle Your Mind — list quizzes, play (timer per question, instant feedback), summary.
 */

import { useState, useEffect, useCallback } from 'react';
import { Brain, ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  hasBackend,
  apiQuizzesList,
  apiQuizGet,
  apiQuizStartAttempt,
  apiQuizSubmitAnswer,
  apiQuizCompleteAttempt,
} from '../../lib/api';

type View = 'list' | 'play' | 'summary';

const EXAM_MODE_LABELS: Record<string, string> = {
  topic_quiz: 'Topic quiz',
  end_of_strand: 'End of strand',
  end_of_term: 'End of term',
  mock_national: 'Mock national',
  timed_drill: 'Timed drill',
  remedial: 'Remedial',
  challenge: 'Challenge',
};

interface QuizItem {
  id: string;
  title: string;
  subject_name: string;
  grade_name: string;
  difficulty: string;
  exam_mode?: string;
  timer_seconds: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: Array<{ id: string; option_text: string; is_correct: number }>;
  explanation: string | null;
}

interface JiggleYourMindPageProps {
  onNavigate: (path: string) => void;
}

export function JiggleYourMindPage({ onNavigate }: JiggleYourMindPageProps) {
  const [view, setView] = useState<View>('list');
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [quiz, setQuiz] = useState<{ id: string; title: string; questions: QuizQuestion[]; timer_seconds: number } | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerSecs, setTimerSecs] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ is_correct: boolean; explanation: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [summary, setSummary] = useState<{ score: number; total: number; time_taken_seconds: number } | null>(null);

  const loadQuizzes = useCallback(async () => {
    if (!hasBackend()) return;
    setLoading(true);
    setError('');
    try {
      const list = await apiQuizzesList();
      setQuizzes(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') loadQuizzes();
  }, [view, loadQuizzes]);

  const startQuiz = async (quizId: string) => {
    setError('');
    try {
      const quizData = await apiQuizGet(quizId);
      const { attempt_id, timer_seconds, question_ids } = await apiQuizStartAttempt(quizId);
      setQuiz({
        id: quizData.id,
        title: quizData.title,
        questions: quizData.questions,
        timer_seconds: quizData.timer_seconds ?? 60,
      });
      setAttemptId(attempt_id);
      setQuestionIds(question_ids);
      setCurrentIndex(0);
      setTimerSecs(timer_seconds ?? 60);
      setFeedback(null);
      setSelectedOptionId(null);
      setView('play');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start quiz');
    }
  };

  const currentQuestionId = questionIds[currentIndex];
  const currentQuestion = quiz?.questions.find((q) => q.id === currentQuestionId);

  useEffect(() => {
    if (view !== 'play' || !currentQuestionId || feedback) return;
    const t = setInterval(() => {
      setTimerSecs((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [view, currentIndex, currentQuestionId, feedback]);

  const submitAnswer = async () => {
    if (!attemptId || !currentQuestionId || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await apiQuizSubmitAnswer(attemptId, currentQuestionId, selectedOptionId);
      setFeedback({ is_correct: result.is_correct, explanation: result.explanation ?? null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const nextOrFinish = async () => {
    if (!attemptId || !quiz) return;
    if (currentIndex < questionIds.length - 1) {
      setCurrentIndex((i) => i + 1);
      setFeedback(null);
      setSelectedOptionId(null);
      setTimerSecs(quiz.timer_seconds);
    } else {
      try {
        const result = await apiQuizCompleteAttempt(attemptId);
        setSummary({ score: result.score, total: result.total_questions, time_taken_seconds: result.time_taken_seconds });
        setView('summary');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to complete');
      }
    }
  };

  if (!hasBackend()) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => onNavigate('/exams')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Exam Center
        </button>
        <p className="text-amber-700">Backend required. Set VITE_API_URL and start the server.</p>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => onNavigate('/exams')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Exam Center
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jiggle Your Mind</h1>
            <p className="text-gray-600 text-sm">Fast practice quizzes — instant feedback, timer per question</p>
          </div>
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        {loading ? (
          <p className="text-gray-500">Loading quizzes...</p>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{q.title}</h3>
                  <p className="text-sm text-gray-500">
                    {q.subject_name} · {q.grade_name} · {q.difficulty}
                    {q.exam_mode && EXAM_MODE_LABELS[q.exam_mode] && (
                      <> · <span className="text-blue-600">{EXAM_MODE_LABELS[q.exam_mode]}</span></>
                    )}
                    {' '}· {q.timer_seconds}s per question
                  </p>
                </div>
                <Button onClick={() => startQuiz(q.id)}>Start</Button>
              </div>
            ))}
            {quizzes.length === 0 && <p className="text-gray-500">No quizzes yet. Run backend seed: npm run seed</p>}
          </div>
        )}
      </div>
    );
  }

  if (view === 'play' && quiz && currentQuestion) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate('/exams')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Question {currentIndex + 1} of {questionIds.length}</span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="font-mono font-medium">{timerSecs}s</span>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-gray-200 bg-white">
          <p className="text-lg font-medium text-gray-900 mb-6">{currentQuestion.question_text}</p>
          {!feedback ? (
            <>
              <div className="space-y-2">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedOptionId === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {opt.option_text}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button onClick={submitAnswer} disabled={!selectedOptionId || submitting}>
                  {submitting ? 'Submitting...' : 'Submit answer'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className={`flex items-center gap-2 p-4 rounded-lg mb-4 ${feedback.is_correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {feedback.is_correct ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="font-medium">{feedback.is_correct ? 'Correct!' : 'Incorrect'}</span>
              </div>
              {feedback.explanation && (
                <p className="text-gray-700 mb-6 p-4 bg-gray-50 rounded-lg">{feedback.explanation}</p>
              )}
              <Button onClick={nextOrFinish}>
                {currentIndex < questionIds.length - 1 ? 'Next question' : 'See results'}
              </Button>
            </>
          )}
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
      </div>
    );
  }

  if (view === 'summary' && summary) {
    return (
      <div className="space-y-6 max-w-md">
        <h2 className="text-2xl font-bold text-gray-900">Quiz complete</h2>
        <div className="p-6 rounded-2xl border border-gray-200 bg-white space-y-4">
          <p className="text-4xl font-bold text-blue-600">{summary.score} / {summary.total}</p>
          <p className="text-gray-600">Time: {Math.floor(summary.time_taken_seconds / 60)}m {summary.time_taken_seconds % 60}s</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setView('list'); setSummary(null); loadQuizzes(); }}>Back to quizzes</Button>
          <Button variant="outline" onClick={() => onNavigate('/exams')}>Exam Center</Button>
        </div>
      </div>
    );
  }

  return null;
}
