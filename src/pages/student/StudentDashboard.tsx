/**
 * Student Dashboard — progress bars, streak, XP, level, badges, daily challenge, recent activity.
 */

import { useState, useEffect, useCallback } from 'react';
import { Award, BookOpen, TrendingUp, Clock, Zap, Flame, Trophy, Target } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  hasBackend,
  apiEngagementSummary,
  apiEngagementProgress,
  apiEngagementDailyChallenge,
  apiEngagementWeaknesses,
  apiEngagementReadiness,
  apiEngagementLeaderboard,
  type EngagementSummary,
} from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

interface StudentDashboardProps {
  onNavigate?: (path: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [progressBySubject, setProgressBySubject] = useState<Array<{ subject_name: string; completed: number; total: number; percent: number }>>([]);
  const [dailyChallenge, setDailyChallenge] = useState<{
    challenge: { id: string; title: string; quiz_id: string; subject_name: string; grade_name: string } | null;
    attempted: { score: number; total_questions: number } | null;
  } | null>(null);
  const [weaknesses, setWeaknesses] = useState<Array<{
    subject_name: string;
    strand_name: string | null;
    sub_strand_name: string | null;
    last_score_percent: number | null;
    attempts_count: number;
  }>>([]);
  const [readiness, setReadiness] = useState<{ grade_name: string; readiness_percent: number; message: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; full_name: string; total_xp: number; level: number }>>([]);
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
      const [s, p, d, w, r, lb] = await Promise.all([
        apiEngagementSummary(),
        apiEngagementProgress(),
        apiEngagementDailyChallenge(),
        apiEngagementWeaknesses().catch(() => []),
        apiEngagementReadiness().catch(() => null),
        apiEngagementLeaderboard({ limit: 10 }).catch(() => []),
      ]);
      setSummary(s);
      setProgressBySubject(p);
      setDailyChallenge(d);
      setWeaknesses(w);
      setReadiness(r || null);
      setLeaderboard(lb || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const name = profile?.full_name?.split(' ')[0] || 'Student';
  const streak = summary?.streak?.current ?? 0;
  const longest = summary?.streak?.longest ?? 0;
  const xp = summary?.xp ?? 0;
  const level = summary?.level ?? 1;
  const badgesCount = summary?.badges_count ?? 0;
  const progressPercent = summary?.progress?.progress_percent ?? 0;
  const quizzesCompleted = summary?.progress?.quizzes_completed ?? 0;
  const examsCompleted = summary?.progress?.exams_completed ?? 0;
  const totalActivities = summary?.progress?.total_activities ?? 0;
  const recentActivity = summary?.recent_activity ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {name}!</h1>
        <p className="text-gray-600">Track your progress and continue your learning journey</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">{error}</div>
      )}

      {readiness && hasBackend() && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardBody className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Assessment readiness</p>
              <p className="text-2xl font-bold text-gray-900">{readiness.readiness_percent}%</p>
              <p className="text-sm text-gray-600 mt-0.5">{readiness.message}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading && hasBackend() ? '…' : `${progressPercent}%`}
              </p>
              {hasBackend() && !loading && (
                <p className="text-xs text-gray-500">{quizzesCompleted + examsCompleted} / {totalActivities} activities</p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Level</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading && hasBackend() ? '…' : level}
              </p>
              {hasBackend() && !loading && (
                <p className="text-xs text-gray-500">{xp.toLocaleString()} XP</p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total XP</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading && hasBackend() ? '…' : xp.toLocaleString()}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Badges</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading && hasBackend() ? '…' : badgesCount}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Learning Streak
              </h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-4xl font-bold text-orange-600">
                    {loading && hasBackend() ? '…' : `${streak} day${streak !== 1 ? 's' : ''}`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {longest > 0 && `Longest: ${longest} days`}
                    {longest === 0 && streak === 0 && "Complete a quiz or exam to start your streak"}
                    {streak > 0 && "Keep it up! You're doing great"}
                  </p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <Flame className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                  const filled = hasBackend() && !loading && streak > i;
                  return (
                    <div key={i} className="text-center">
                      <div
                        className={`w-full h-12 rounded-lg mb-1 flex items-center justify-center ${
                          filled ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {filled ? '✓' : ''}
                      </div>
                      <p className="text-xs text-gray-600">Day {i + 1}</p>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {dailyChallenge?.challenge && !dailyChallenge.attempted && hasBackend() && (
            <Card className="border-2 border-amber-200 bg-amber-50/50">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Daily Challenge
                </h3>
              </CardHeader>
              <CardBody>
                <p className="font-medium text-gray-900">{dailyChallenge.challenge.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {dailyChallenge.challenge.subject_name} · {dailyChallenge.challenge.grade_name}
                </p>
                <Button
                  className="mt-4"
                  variant="primary"
                  onClick={() => onNavigate?.('/jiggle-your-mind')}
                >
                  Start challenge
                </Button>
              </CardBody>
            </Card>
          )}

          {(dailyChallenge?.attempted || (dailyChallenge?.challenge === null && hasBackend())) && (
            <Card className="border-2 border-amber-200 bg-amber-50/50">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Daily Challenge
                </h3>
              </CardHeader>
              <CardBody>
                {dailyChallenge?.attempted ? (
                  <>
                    <p className="text-green-700 font-medium">Completed today!</p>
                    <p className="text-sm text-gray-600">
                      Score: {dailyChallenge.attempted.score} / {dailyChallenge.attempted.total_questions}
                    </p>
                    <p className="text-sm text-amber-800 mt-2 font-medium">
                      Come back tomorrow for the next challenge — +10 bonus XP for consistency!
                    </p>
                  </>
                ) : (
                  <p className="text-amber-800 font-medium">
                    Come back tomorrow for a new daily challenge. +10 bonus XP when you complete it!
                  </p>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </CardHeader>
            <CardBody>
              {loading && hasBackend() ? (
                <p className="text-gray-500">Loading...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-gray-500">Complete quizzes or exams to see activity here.</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 8).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.type === 'quiz' ? 'Quiz' : 'Exam'}: {item.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.subject_name} · {formatTimeAgo(item.completed_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {leaderboard.length > 0 && hasBackend() && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Top learners
                </h3>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry) => (
                    <li key={entry.rank} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">
                        #{entry.rank} {entry.full_name}
                      </span>
                      <span className="text-gray-600">{entry.total_xp.toLocaleString()} XP</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          {weaknesses.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Topics to revise</h3>
                <p className="text-sm text-gray-600">Practice these to improve your scores</p>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {weaknesses.slice(0, 5).map((w, i) => (
                    <li key={i} className="text-sm flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        {w.subject_name}
                        {w.strand_name && ` · ${w.strand_name}`}
                        {w.sub_strand_name && ` · ${w.sub_strand_name}`}
                      </span>
                      <span className="text-amber-700">
                        {w.last_score_percent != null ? `${w.last_score_percent}%` : `${w.attempts_count} attempt(s)`}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => onNavigate?.('/jiggle-your-mind')}
                >
                  Practice quizzes
                </Button>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">All activities</span>
                  <span className="font-medium text-gray-900">{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
              </div>
              {progressBySubject.length > 0 && (
                <div className="space-y-3 mt-4">
                  {progressBySubject.map((s) => (
                    <div key={s.subject_name}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-700">{s.subject_name}</span>
                        <span className="font-medium text-gray-900">{s.percent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, s.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {progressBySubject.length === 0 && !loading && hasBackend() && (
                <p className="text-sm text-gray-500">Complete quizzes to see progress by subject.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Learning Goals</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Complete activities</p>
                    <p className="text-xs text-gray-600">
                      {quizzesCompleted + examsCompleted} completed · {totalActivities} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Earn badges</p>
                    <p className="text-xs text-gray-600">{badgesCount} earned</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Build your streak</p>
                    <p className="text-xs text-gray-600">{streak} day streak · Best: {longest} days</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
