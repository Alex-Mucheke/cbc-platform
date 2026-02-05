/**
 * Exam Center hub — links to Jiggle Your Mind and Sitting Exam.
 */

import { Brain, FileText } from 'lucide-react';
import { hasBackend } from '../../lib/api';

interface ExamCenterPageProps {
  onNavigate: (path: string) => void;
}

export function ExamCenterPage({ onNavigate }: ExamCenterPageProps) {
  const hasAPI = hasBackend();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Center</h1>
        <p className="text-gray-600">Practice quizzes and formal written exams</p>
      </div>

      {!hasAPI ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-medium">Backend required</p>
          <p className="text-sm mt-1">Set VITE_API_URL in .env and start the backend to use Jiggle Your Mind and Sitting Exam.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => onNavigate('/jiggle-your-mind')}
            className="text-left p-6 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <Brain className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Jiggle Your Mind</h2>
            <p className="text-gray-600 text-sm">Fast practice quizzes — multiple choice & true/false, instant feedback, timer per question.</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/sitting-exam')}
            className="text-left p-6 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 rounded-xl bg-cyan-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-cyan-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sitting Exam</h2>
            <p className="text-gray-600 text-sm">Formal timed exams — typed answers, autosave, one attempt. Results after teacher marking.</p>
          </button>
        </div>
      )}
    </div>
  );
}
