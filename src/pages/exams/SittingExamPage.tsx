/**
 * Sitting Exam — list exams, timed session, typed answers, autosave, submit. Results after marking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Profile } from '../../lib/auth';
import {
  hasBackend,
  apiWrittenExamsList,
  apiWrittenExamGet,
  apiWrittenExamStartSubmission,
  apiWrittenExamAutosave,
  apiWrittenExamSubmit,
  apiWrittenExamMySubmissions,
  apiWrittenExamGetSubmission,
} from '../../lib/api';

type View = 'list' | 'take' | 'result';

const EXAM_MODE_LABELS: Record<string, string> = {
  topic_quiz: 'Topic quiz',
  end_of_strand: 'End of strand',
  end_of_term: 'End of term',
  mock_national: 'Mock national',
  timed_drill: 'Timed drill',
  remedial: 'Remedial',
  challenge: 'Challenge',
};

interface ExamItem {
  id: string;
  title: string;
  subject_name: string;
  grade_name: string;
  duration_minutes: number;
  one_attempt_only: number;
  exam_mode?: string;
}

interface SittingExamPageProps {
  onNavigate: (path: string) => void;
  profile?: Profile;
}
// profile reserved for future (e.g. grade filter)

const AUTOSAVE_MS = 3000;

export function SittingExamPage({ onNavigate }: SittingExamPageProps) {
  const [view, setView] = useState<View>('list');
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Array<{ id: string; exam_title: string; status: string; submitted_at: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [exam, setExam] = useState<{ id: string; title: string; duration_minutes: number; questions: Array<{ id: string; question_text: string; max_marks: number }> } | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSecs, setTimeRemainingSecs] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  const [result, setResult] = useState<{ questions: Array<{ question_text: string; answer_text: string; marks_awarded?: number; marks_comment?: string; max_marks: number }>; total_marks_awarded: number; total_max_marks: number; status: string } | null>(null);

  const loadList = useCallback(async () => {
    if (!hasBackend()) return;
    setLoading(true);
    setError('');
    try {
      const [examList, subs] = await Promise.all([apiWrittenExamsList(), apiWrittenExamMySubmissions()]);
      setExams(examList);
      setMySubmissions(subs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') loadList();
  }, [view, loadList]);

  const startExam = async (examId: string) => {
    setError('');
    try {
      const examData = await apiWrittenExamGet(examId);
      const { submission_id, duration_minutes } = await apiWrittenExamStartSubmission(examId);
      setExam({
        id: examData.id,
        title: examData.title,
        duration_minutes: examData.duration_minutes,
        questions: examData.questions,
      });
      setSubmissionId(submission_id);
      setAnswers(Object.fromEntries(examData.questions.map((q: { id: string }) => [q.id, ''])));
      setTimeRemainingSecs(duration_minutes * 60);
      setSubmitted(false);
      startTimeRef.current = Date.now();
      setView('take');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start exam');
    }
  };

  const autosave = useCallback(async () => {
    if (!submissionId || submitted) return;
    const list = Object.entries(answers).map(([question_id, answer_text]) => ({ question_id, answer_text }));
    if (list.every((a) => !a.answer_text.trim())) return;
    try {
      await apiWrittenExamAutosave(submissionId, list);
    } catch (err) {
      void err;
      // ignore autosave errors
    }

  }, [submissionId, answers, submitted]);

  useEffect(() => {
    if (view !== 'take' || !submissionId || submitted) return;
    autosaveTimer.current = setInterval(autosave, AUTOSAVE_MS);
    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
    };
  }, [view, submissionId, submitted, autosave]);

  useEffect(() => {
    if (view !== 'take' || timeRemainingSecs <= 0) return;
    const t = setInterval(() => setTimeRemainingSecs((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [view, timeRemainingSecs]);

  const handleSubmit = async () => {
    if (!submissionId || submitted) return;
    setError('');
    try {
      await autosave();
      await apiWrittenExamSubmit(submissionId);
      setSubmitted(true);
      const data = await apiWrittenExamGetSubmission(submissionId);
      setResult({
        questions: data.questions,
        total_marks_awarded: data.total_marks_awarded ?? 0,
        total_max_marks: data.total_max_marks ?? 0,
        status: data.status,
      });
      setView('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    }
  };

  useEffect(() => {
    if (view === 'take' && timeRemainingSecs <= 0 && submissionId && !submitted) {
      handleSubmit();
    }
  }, [timeRemainingSecs, submissionId, submitted, view]);

  if (!hasBackend()) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => onNavigate('/exams')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Exam Center
        </button>
        <p className="text-amber-700">Backend required.</p>
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
          <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sitting Exam</h1>
            <p className="text-gray-600 text-sm">Formal timed exams — typed answers, one attempt. Results after teacher marking.</p>
          </div>
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            {exams.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900">Available exams</h2>
                {exams.map((e) => {
                  const mySub = mySubmissions.find((s) => s.exam_title === e.title);
                  return (
                    <div key={e.id} className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{e.title}</h3>
                        <p className="text-sm text-gray-500">
                          {e.subject_name} · {e.grade_name} · {e.duration_minutes} min
                          {e.exam_mode && EXAM_MODE_LABELS[e.exam_mode] && (
                            <> · <span className="text-cyan-600">{EXAM_MODE_LABELS[e.exam_mode]}</span></>
                          )}
                          {' '}· {e.one_attempt_only ? 'One attempt' : 'Multiple attempts'}
                        </p>
                      </div>
                      {mySub ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{mySub.status}</span>
                          <Button variant="outline" size="sm" onClick={async () => {
                            try {
                              const data = await apiWrittenExamGetSubmission(mySub.id);
                              setResult({
                                questions: data.questions,
                                total_marks_awarded: data.total_marks_awarded ?? 0,
                                total_max_marks: data.total_max_marks ?? 0,
                                status: data.status,
                              });
                              setView('result');
                            } catch (err) {
                              void err;
                            }
                          }}>View result</Button>

                        </div>
                      ) : (
                        <Button onClick={() => startExam(e.id)}>Start exam</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {exams.length === 0 && <p className="text-gray-500">No exams yet. Run backend seed.</p>}
          </>
        )}
      </div>
    );
  }

  if (view === 'take' && exam && submissionId) {
    const mins = Math.floor(timeRemainingSecs / 60);
    const secs = timeRemainingSecs % 60;
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => onNavigate('/exams')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeft className="w-4 h-4" /> Exit (answers autosaved)
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-mono">
              <Clock className="w-5 h-5" />
              {mins}:{secs.toString().padStart(2, '0')}
            </div>
            <Button onClick={handleSubmit} disabled={submitted}>Submit exam</Button>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{exam.title}</h2>
        <p className="text-sm text-gray-500">Answers are saved automatically. Submit when done or when time runs out.</p>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        <div className="space-y-6">
          {exam.questions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-xl border border-gray-200 bg-white">
              <p className="font-medium text-gray-900 mb-2">Question {idx + 1} ({q.max_marks} marks)</p>
              <p className="text-gray-700 mb-4">{q.question_text}</p>
              <textarea
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="Type your answer..."
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'result' && result) {
    return (
      <div className="space-y-6 max-w-3xl">
        <button type="button" onClick={() => { setView('list'); setResult(null); loadList(); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to exams
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Exam result</h2>
        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <p className="text-2xl font-bold text-blue-600">{result.total_marks_awarded} / {result.total_max_marks}</p>
          <p className="text-sm text-gray-500 capitalize">{result.status}</p>
        </div>
        {result.status === 'marked' ? (
          <div className="space-y-4">
            {result.questions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white">
                <p className="font-medium text-gray-900">{q.question_text}</p>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{q.answer_text || '(No answer)'}</p>
                {q.marks_awarded != null && <p className="mt-2 text-sm font-medium">Marks: {q.marks_awarded} / {q.max_marks}</p>}
                {q.marks_comment && <p className="text-sm text-gray-500 mt-1">{q.marks_comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Your submission has been received. Results will appear here after your teacher marks the exam.</p>
        )}
      </div>
    );
  }

  return null;
}
