/**
 * Digital Library — CBC structure: Grade → Subject → Strand → Books.
 * Filter by grade, subject, resource type; search; recently added, most used; Past papers section.
 */

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Download, Eye, Search, Upload } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  hasBackend,
  apiLibraryList,
  apiLibraryRecent,
  apiLibraryMostUsed,
  apiLibraryTypes,
  apiGrades,
  apiSubjects,
} from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const sampleResources = [
  { id: '1', title: 'Mathematics Grade 7 - Learner\'s Book', resource_type: 'textbook', subject_name: 'Mathematics', grade_name: 'Grade 7', author: 'KICD', page_count: 240, view_count: 4231, download_count: 1523 },
  { id: '2', title: 'English Activities Grade 6', resource_type: 'activity_book', subject_name: 'English', grade_name: 'Grade 6', author: 'KICD', page_count: 180, view_count: 5672, download_count: 2104 },
  { id: '3', title: 'Science and Technology Grade 5', resource_type: 'textbook', subject_name: 'Science', grade_name: 'Grade 5', author: 'KICD', page_count: 200, view_count: 3847, download_count: 1892 },
];

const defaultGrades = ['All', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
const defaultSubjects = ['All', 'Mathematics', 'English', 'Science', 'Kiswahili', 'Social Studies', 'Creative Arts'];
const defaultTypes = [{ id: 'All', label: 'All' }, { id: 'textbook', label: 'Textbook' }, { id: 'activity_book', label: 'Activity Book' }, { id: 'teacher_guide', label: 'Teacher Guide' }];

function formatType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LibraryPage({ onNavigate }: { onNavigate?: (path: string) => void } = {}) {
  const { profile } = useAuth();
  const [useApi, setUseApi] = useState(false);
  const [grades, setGrades] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [resourceTypes, setResourceTypes] = useState<Array<{ id: string; label: string }>>([]);
  const [resources, setResources] = useState<Array<{ id: string; title: string; resource_type: string; subject_name: string; grade_name: string; author?: string; page_count?: number; view_count: number; download_count: number; marking_scheme_url?: string; examiner_notes?: string }>>([]);
  const [recent, setRecent] = useState<Array<{ id: string; title: string; resource_type: string; grade_name: string; subject_name: string }>>([]);
  const [mostUsed, setMostUsed] = useState<Array<{ id: string; title: string; resource_type: string; grade_name: string; subject_name: string; view_count: number; download_count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedGradeId, setSelectedGradeId] = useState('All');
  const [selectedSubjectId, setSelectedSubjectId] = useState('All');
  const [selectedTypeId, setSelectedTypeId] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'most_used'>('recent');

  const canUpload = profile?.user_type === 'teacher' || profile?.user_type === 'admin';

  const loadMeta = useCallback(async () => {
    if (!hasBackend()) return;
    try {
      const [g, s, t] = await Promise.all([apiGrades(), apiSubjects(), apiLibraryTypes()]);
      setGrades(g);
      setSubjects(s);
      setResourceTypes(t);
      setUseApi(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load filters');
    }
  }, []);

  const loadResources = useCallback(async () => {
    if (!hasBackend()) return;
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { sort };
      if (selectedGradeId !== 'All') params.grade_id = selectedGradeId;
      if (selectedSubjectId !== 'All') params.subject_id = selectedSubjectId;
      if (selectedTypeId !== 'All') params.resource_type = selectedTypeId;
      if (searchQuery.trim()) params.q = searchQuery.trim();
      const list = await apiLibraryList(params);
      setResources(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGradeId, selectedSubjectId, selectedTypeId, searchQuery, sort]);

  const loadRecentAndMostUsed = useCallback(async () => {
    if (!hasBackend()) return;
    try {
      const [r, m] = await Promise.all([apiLibraryRecent(), apiLibraryMostUsed()]);
      setRecent(r);
      setMostUsed(m);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (useApi) {
      loadResources();
    }
  }, [useApi, loadResources]);

  useEffect(() => {
    if (useApi) loadRecentAndMostUsed();
  }, [useApi, loadRecentAndMostUsed]);

  const displayResources = useApi ? resources : sampleResources.filter((r) => {
    const matchGrade = selectedGradeId === 'All' || r.grade_name === selectedGradeId;
    const matchSubject = selectedSubjectId === 'All' || r.subject_name === selectedSubjectId;
    const matchType = selectedTypeId === 'All' || r.resource_type === selectedTypeId;
    const matchSearch = !searchQuery.trim() || r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchSubject && matchType && matchSearch;
  });

  const gradeOptions = useApi ? grades : defaultGrades.map((name) => ({ id: name, name }));
  const subjectOptions = useApi ? subjects : defaultSubjects.map((name) => ({ id: name, name }));
  const typeOptions = useApi ? resourceTypes : defaultTypes;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Library</h1>
          <p className="text-gray-600">CBC-aligned books: Grade → Subject → Strand. Textbooks, workbooks, teacher guides, revision notes, past papers.</p>
        </div>
        {hasBackend() && canUpload && onNavigate && (
          <Button variant="primary" onClick={() => onNavigate('/library/upload')}>
            <Upload className="w-4 h-4 mr-2" />
            Upload book
          </Button>
        )}
      </div>

      {useApi && (recent.length > 0 || mostUsed.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recent.length > 0 && (
            <Card>
              <CardBody>
                <h3 className="font-semibold text-gray-900 mb-2">Recently added</h3>
                <ul className="space-y-1 text-sm">
                  {recent.slice(0, 5).map((r) => (
                    <li key={r.id} className="text-gray-600">{r.title} — {r.grade_name} · {r.subject_name}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          {mostUsed.length > 0 && (
            <Card>
              <CardBody>
                <h3 className="font-semibold text-gray-900 mb-2">Most used</h3>
                <ul className="space-y-1 text-sm">
                  {mostUsed.slice(0, 5).map((r) => (
                    <li key={r.id} className="text-gray-600">{r.title} — {r.view_count + r.download_count} uses</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardBody>
          {useApi && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-600 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => setSelectedTypeId(selectedTypeId === 'past_paper' ? 'All' : 'past_paper')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTypeId === 'past_paper'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Past papers
              </button>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search by title, subject, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                <option value="All">All grades</option>
                {gradeOptions.map((g) => (
                  <option key={g.id} value={typeof g === 'string' ? g : g.id}>
                    {typeof g === 'string' ? g : g.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                <option value="All">All subjects</option>
                {subjectOptions.map((s) => (
                  <option key={typeof s === 'string' ? s : s.id} value={typeof s === 'string' ? s : s.id}>
                    {typeof s === 'string' ? s : s.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                <option value="All">All types</option>
                {typeOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              {useApi && (
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as 'recent' | 'most_used')}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="recent">Recent</option>
                  <option value="most_used">Most used</option>
                </select>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{displayResources.length}</span> resources
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayResources.map((resource) => (
            <Card key={resource.id} hover>
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-gray-300" />
              </div>
              <CardBody>
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {formatType(resource.resource_type)}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {resource.grade_name}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{resource.title}</h3>
                  <p className="text-sm text-gray-600">{resource.subject_name}</p>
                  {resource.author && <p className="text-xs text-gray-500 mt-1">{resource.author}</p>}
                  {resource.resource_type === 'past_paper' && (resource.marking_scheme_url || resource.examiner_notes) && (
                    <p className="text-xs text-amber-700 mt-1">
                      {resource.examiner_notes && <span>{resource.examiner_notes}</span>}
                      {resource.marking_scheme_url && <span className="block mt-0.5">Marking scheme available</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {(resource.view_count ?? 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {(resource.download_count ?? 0).toLocaleString()}
                  </span>
                  {resource.page_count != null && <span>{resource.page_count} pages</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" className="flex-1" size="sm">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Read
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {!loading && displayResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600">Try adjusting your search or filters. {useApi && 'Run backend seed: npm run seed'}</p>
        </div>
      )}
    </div>
  );
}
