/**
 * Academic Calendar: terms, weeks, holidays, exams, assignments.
 * Color by type, countdown to exams, competency hints, export.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Printer, Bell, AlertCircle } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { hasBackend, apiGrades, apiCalendarEvents, apiEngagementWeaknesses } from '../../lib/api';

const EVENT_TYPE_COLORS: Record<string, string> = {
  lesson: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700',
  quiz: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700',
  assignment: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
  exam: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700',
  event: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700',
  holiday: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
  announcement: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalEvent {
  id: string;
  grade_id: string | null;
  subject_id: string | null;
  title: string;
  event_type: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  term_id: string | null;
  competency_hint: string | null;
}

function getMonthStartEnd(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function getDaysInMonth(year: number, month: number): (number | null)[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const startPad = first.getDay();
  const days: (number | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export function CalendarPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [gradeId, setGradeId] = useState('');
  const [grades, setGrades] = useState<Array<{ id: string; name: string }>>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [weaknesses, setWeaknesses] = useState<Array<{ subject_name: string; strand_name: string | null }>>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGrades = useCallback(async () => {
    if (!hasBackend()) return;
    try {
      const g = await apiGrades();
      setGrades(g);
      if (g.length && !gradeId) setGradeId(g[0].id);
    } catch {
      setGrades([]);
    }
  }, [gradeId]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  useEffect(() => {
    if (grades.length > 0 && !gradeId) setGradeId(grades[0].id);
  }, [grades]);

  useEffect(() => {
    const { start, end } = getMonthStartEnd(year, month);
    if (!hasBackend()) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiCalendarEvents({ grade_id: gradeId || undefined, start, end })
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [year, month, gradeId]);

  useEffect(() => {
    if (!hasBackend()) return;
    apiEngagementWeaknesses().then(setWeaknesses).catch(() => setWeaknesses([]));
  }, []);

  const eventsByDate = events.reduce<Record<string, CalEvent[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const upcomingExams = events
    .filter((e) => e.event_type === 'exam' && e.date >= today.toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const days = getDaysInMonth(year, month);
  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const handlePrint = () => window.print();

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 print:flex-none">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Academic year · Terms, exams, holidays · Competency-aware</p>
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
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate?.('/timetable')} className="flex items-center gap-2">
            <CalIcon className="w-4 h-4" />
            Timetable
          </Button>
        </div>
      </div>

      {upcomingExams.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 no-print">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Countdown to exams
            </h3>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {upcomingExams.map((e) => {
                const d = new Date(e.date);
                const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
                return (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{e.title}</span>
                    <span className="text-amber-700 dark:text-amber-300">
                      {e.date} {diff > 0 ? `— in ${diff} day${diff !== 1 ? 's' : ''}` : '— today'}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate?.('/exams')}>
              Open Exam Center
            </Button>
          </CardBody>
        </Card>
      )}

      {weaknesses.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10 no-print">
          <CardBody className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Competency hint:</strong> Practice {weaknesses[0].subject_name}
              {weaknesses[0].strand_name ? ` — ${weaknesses[0].strand_name}` : ''}. Ask AI for catch-up suggestions.
            </p>
            <Button variant="outline" size="sm" onClick={() => onNavigate?.('/discussions')}>
              Ask AI
            </Button>
          </CardBody>
        </Card>
      )}

      <div className="flex gap-4 flex-col lg:flex-row">
        <Card className="flex-1 print:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{monthLabel}</h2>
            <div className="flex gap-1 no-print">
              <button type="button" onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {DAY_NAMES.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr" style={{ gridAutoRows: 'minmax(80px, auto)' }}>
              {days.map((d, i) => {
                const dateStr = d === null ? '' : `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayEvents = dateStr ? (eventsByDate[dateStr] ?? []) : [];
                const isToday = dateStr === today.toISOString().slice(0, 10);
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => d !== null && setSelectedDate(dateStr)}
                    className={`min-h-[80px] p-2 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 text-left ${
                      d === null ? 'bg-gray-50 dark:bg-gray-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''} ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    {d !== null && (
                      <>
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                          {d}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className={`text-xs truncate rounded px-1 py-0.5 border ${EVENT_TYPE_COLORS[ev.event_type] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}
                              title={ev.title}
                            >
                              {ev.event_type === 'holiday' ? '🏷 ' : ''}{ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">+{dayEvents.length - 2}</span>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <div className="w-full lg:w-80 space-y-4 no-print">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDate ? new Date(selectedDate).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'Select a day'}
              </h3>
            </CardHeader>
            <CardBody>
              {!selectedDate ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Click a day on the calendar to see events.</p>
              ) : selectedEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No events on this day.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((ev) => (
                    <li key={ev.id}>
                      <div className={`rounded-lg border p-3 ${EVENT_TYPE_COLORS[ev.event_type] ?? 'bg-gray-100 dark:bg-gray-800'}`}>
                        <p className="font-medium">{ev.title}</p>
                        {(ev.start_time || ev.description) && (
                          <p className="text-xs mt-1 opacity-90">
                            {ev.start_time && `${ev.start_time}${ev.end_time ? ` – ${ev.end_time}` : ''}`}
                            {ev.description && ` · ${ev.description}`}
                          </p>
                        )}
                        {ev.competency_hint && (
                          <p className="text-xs mt-1 opacity-75">Competency: {ev.competency_hint}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {(ev.entity_type === 'quiz' || ev.entity_type === 'written_exam') && (
                            <Button variant="outline" size="sm" onClick={() => onNavigate?.('/exams')}>
                              Open
                            </Button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Legend</h3>
            </CardHeader>
            <CardBody className="space-y-1.5 text-xs">
              {Object.entries(EVENT_TYPE_COLORS).map(([type, cls]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded border ${cls}`} />
                  <span className="capitalize text-gray-700 dark:text-gray-300">{type}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
