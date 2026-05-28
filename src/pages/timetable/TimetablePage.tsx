/**
 * Interactive Timetable: Week / Day view, competency-aware, links to content, reminders, print.
 */

import { useState, useEffect, useCallback } from 'react';
import { Clock, LayoutGrid, List, Bot, Printer, Bell } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { hasBackend, apiGrades, apiTimetable, apiEngagementWeaknesses } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
  English: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
  Science: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700',
  Kiswahili: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700',
  'Social Studies': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700',
  'Creative Arts': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-700',
};

function getSubjectColor(subjectName: string): string {
  return SUBJECT_COLORS[subjectName] ?? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
}

interface TimetableSlot {
  id: string;
  grade_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: string;
  subject_name: string;
  title: string;
  strand_id: string | null;
  competency_hint: string | null;
  link_type: string | null;
  link_id: string | null;
  is_suggested: number;
  sort_order: number;
}

export function TimetablePage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  useAuth();

  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState(1);
  const [gradeId, setGradeId] = useState<string>('');
  const [grades, setGrades] = useState<Array<{ id: string; name: string }>>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [weaknessHint, setWeaknessHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!hasBackend()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [gradesRes, weaknessesRes] = await Promise.all([
        apiGrades(),
        apiEngagementWeaknesses().catch(() => []),
      ]);
      setGrades(gradesRes);
      setGradeId((prev) => (prev ? prev : gradesRes[0]?.id ?? ''));
      if (Array.isArray(weaknessesRes) && weaknessesRes.length > 0) {
        const w = weaknessesRes[0];
        setWeaknessHint(`Suggested: Extra practice for ${w.subject_name}${w.strand_name ? ` — ${w.strand_name}` : ''}`);
      } else setWeaknessHint(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!hasBackend() || !gradeId) {
      setSlots([]);
      return;
    }
    apiTimetable(gradeId)
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [gradeId]);

  const slotsByDay = (day: number) => slots.filter((s) => s.day_of_week === day);
  const nextSlot = (): TimetableSlot | null => {
    const now = new Date();
    const jsDay = now.getDay();
    const day = jsDay >= 1 && jsDay <= 5 ? jsDay : 1;
    const current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const todaySlots = slotsByDay(day)
      .filter((s) => s.start_time >= current)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return todaySlots[0] ?? null;
  };
  const next = nextSlot();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 print:flex-none">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Timetable</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Weekly schedule · Competency-aware · Links to content</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          {grades.length > 1 && (
            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <button
              type="button"
              onClick={() => setView('week')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'week' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Week
            </button>
            <button
              type="button"
              onClick={() => setView('day')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${view === 'day' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <List className="w-4 h-4" />
              Day
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2 ml-2">
            <Printer className="w-4 h-4" />
            Print / PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">{error}</div>
      )}

      {weaknessHint && (
        <Card className="border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 no-print">
          <CardBody className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{weaknessHint}</p>
            <Button variant="outline" size="sm" onClick={() => onNavigate?.('/jiggle-your-mind')}>
              Practice now
            </Button>
          </CardBody>
        </Card>
      )}

      {next && (
        <Card className="border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 no-print">
          <CardBody className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Next up</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {next.subject_name} — {next.title} at {next.start_time}
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => onNavigate?.('/exams')}>
              Open Exam Center
            </Button>
          </CardBody>
        </Card>
      )}

      {view === 'day' && (
        <div className="flex gap-2 flex-wrap no-print">
          {[1, 2, 3, 4, 5].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedDay === day ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              {DAY_NAMES[day]}
            </button>
          ))}
        </div>
      )}

      {loading && hasBackend() ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'week' ? (
        <Card className="overflow-hidden print:shadow-none">
          <CardBody className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border-b border-gray-200 dark:border-gray-700">
              {[1, 2, 3, 4, 5].map((day) => (
                <div key={day} className="border-r border-gray-200 dark:border-gray-700 last:border-r-0 p-3 bg-gray-50 dark:bg-gray-800/50">
                  <p className="font-semibold text-gray-900 dark:text-white text-center">{DAY_NAMES[day]}</p>
                  <div className="mt-3 space-y-2">
                    {slotsByDay(day).map((slot) => (
                      <SlotCard key={slot.id} slot={slot} onNavigate={onNavigate} />
                    ))}
                    {slotsByDay(day).length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No slots</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="print:shadow-none">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{DAY_NAMES[selectedDay]}</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {slotsByDay(selectedDay).length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 py-8 text-center">No slots for this day.</p>
              ) : (
                slotsByDay(selectedDay).map((slot) => (
                  <SlotCard key={slot.id} slot={slot} onNavigate={onNavigate} expanded />
                ))
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

function SlotCard({
  slot,
  onNavigate,
  expanded = false,
}: {
  slot: TimetableSlot;
  onNavigate?: (path: string) => void;
  expanded?: boolean;
}) {
  const [showCompetency, setShowCompetency] = useState(false);
  const color = getSubjectColor(slot.subject_name);

  return (
    <div
      className={`rounded-xl border p-3 ${color} ${slot.is_suggested ? 'ring-2 ring-amber-400' : ''}`}
      onMouseEnter={() => setShowCompetency(true)}
      onMouseLeave={() => setShowCompetency(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{slot.subject_name}</p>
          <p className="text-sm opacity-90 truncate">{slot.title}</p>
          <p className="text-xs opacity-75 mt-0.5">
            {slot.start_time} – {slot.end_time}
          </p>
        </div>
        {slot.is_suggested && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-700 flex-shrink-0">Suggested</span>
        )}
      </div>
      {(showCompetency || expanded) && slot.competency_hint && (
        <p className="text-xs mt-2 pt-2 border-t border-current/20 opacity-90">Competency: {slot.competency_hint}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-2 no-print">
        <button
          type="button"
          onClick={() => onNavigate?.('/jiggle-your-mind')}
          className="text-xs font-medium px-2 py-1 rounded bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30"
        >
          Quiz
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('/library')}
          className="text-xs font-medium px-2 py-1 rounded bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30"
        >
          Library
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('/exams')}
          className="text-xs font-medium px-2 py-1 rounded bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30"
        >
          Exams
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('/discussions')}
          className="text-xs font-medium px-2 py-1 rounded bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/30 flex items-center gap-1"
        >
          <Bot className="w-3 h-3" />
          Ask AI
        </button>
      </div>
    </div>
  );
}
