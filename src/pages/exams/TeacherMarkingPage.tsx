/**
 * Teacher review panel — list written submissions, mark with score and comment per question.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, FileCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  hasBackend,
  apiWrittenExamSubmissionsToMark,
  apiWrittenExamGetSubmission,
  apiWrittenExamMarkSubmission,
} from '../../lib/api';

interface TeacherMarkingPageProps {
  onNavigate: (path: string) => void;
}

interface SubmissionRow {
  id: string;
  exam_title: string;
  student_name: string;
  student_email?: string;
  status: string;
}

interface QuestionWithAnswer {
  id: string;
  question_text: string;
  max_marks: number;
  answer_text: string;
  marks_awarded?: number;
  marks_comment?: string;
}

export function TeacherMarkingPage({ onNavigate }: TeacherMarkingPageProps) {
  const [list, setList] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<{
    id: string;
    exam_title: string;
    student_name: string;
    questions: QuestionWithAnswer[];
    total_marks_awarded: number;
    total_max_marks: number;
  } | null>(null);
  const [reviews, setReviews] = useState<Record<string, { marks_awarded: number; comment: string }>>({});
  const [saving, setSaving] = useState(false);

  const loadList = useCallback(async () => {
    if (!hasBackend()) return;
    setLoading(true);
    setError('');
    try {
      const rows = await apiWrittenExamSubmissionsToMark();
      setList(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openSubmission = async (id: string) => {
    setError('');
    try {
      const data = await apiWrittenExamGetSubmission(id);
      setSubmission({
        id: data.id,
        exam_title: data.exam_title,
        student_name: data.student_name ?? 'Student',
        questions: data.questions,
        total_marks_awarded: data.total_marks_awarded ?? 0,
        total_max_marks: data.total_max_marks ?? 0,
      });
      setReviews(
        Object.fromEntries(
          (data.questions || []).map((q: QuestionWithAnswer) => [
            q.id,
            { marks_awarded: q.marks_awarded ?? 0, comment: q.marks_comment ?? '' },
          ])
        )
      );
      setSelectedId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load submission');
    }
  };

  const saveMarks = async () => {
    if (!selectedId || !submission) return;
    setSaving(true);
    setError('');
    try {
      const reviewList = submission.questions.map((q) => ({
        question_id: q.id,
        marks_awarded: reviews[q.id]?.marks_awarded ?? 0,
        max_marks: q.max_marks,
        comment: reviews[q.id]?.comment?.trim() || undefined,
      }));
      await apiWrittenExamMarkSubmission(selectedId, reviewList);
      setSelectedId(null);
      setSubmission(null);
      loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (!hasBackend()) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => onNavigate('/exams')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-amber-700">Backend required.</p>
      </div>
    );
  }

  if (submission && selectedId) {
    const totalAwarded = submission.questions.reduce((s, q) => s + (reviews[q.id]?.marks_awarded ?? 0), 0);
    return (
      <div className="space-y-6 max-w-3xl">
        <button type="button" onClick={() => { setSelectedId(null); setSubmission(null); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>
        <h2 className="text-xl font-bold text-gray-900">{submission.exam_title}</h2>
        <p className="text-gray-600">Student: {submission.student_name}</p>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        <div className="space-y-6">
          {submission.questions.map((q) => (
            <div key={q.id} className="p-4 rounded-xl border border-gray-200 bg-white">
              <p className="font-medium text-gray-900 mb-2">Q: {q.question_text} (max {q.max_marks} marks)</p>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{q.answer_text || '(No answer)'}</p>
              <div className="flex gap-4 items-start">
                <label className="flex flex-col gap-1 text-sm">
                  Marks
                  <input
                    type="number"
                    min={0}
                    max={q.max_marks}
                    value={reviews[q.id]?.marks_awarded ?? 0}
                    onChange={(e) =>
                      setReviews((r) => ({
                        ...r,
                        [q.id]: { ...r[q.id], marks_awarded: Math.min(q.max_marks, Math.max(0, Number(e.target.value) || 0)) },
                      }))
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </label>
                <label className="flex-1 flex flex-col gap-1 text-sm">
                  Comment
                  <input
                    type="text"
                    value={reviews[q.id]?.comment ?? ''}
                    onChange={(e) => setReviews((r) => ({ ...r, [q.id]: { ...r[q.id], comment: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Optional comment"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">Total: {totalAwarded} / {submission.total_max_marks}</p>
          <Button onClick={saveMarks} disabled={saving}>{saving ? 'Saving...' : 'Save marks'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => onNavigate('/exams')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Exam Center
      </button>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
          <FileCheck className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mark written exams</h1>
          <p className="text-gray-600 text-sm">Review and mark student submissions</p>
        </div>
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {list.map((row) => (
            <div
              key={row.id}
              className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{row.exam_title}</p>
                <p className="text-sm text-gray-500">{row.student_name} · {row.status}</p>
              </div>
              <Button size="sm" onClick={() => openSubmission(row.id)}>Mark</Button>
            </div>
          ))}
          {list.length === 0 && <p className="text-gray-500">No submissions to mark.</p>}
        </div>
      )}
    </div>
  );
}
