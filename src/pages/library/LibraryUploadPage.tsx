/**
 * Upload book — teacher/admin: Grade, Subject, Strand, type, title, description, tags, file path.
 * Teacher uploads go to pending; admin can set approved.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import {
  hasBackend,
  apiGrades,
  apiSubjects,
  apiStrands,
  apiSubStrands,
  apiLibraryTypes,
  apiLibraryCreate,
  apiLibraryMyUploads,
} from '../../lib/api';

interface LibraryUploadPageProps {
  onNavigate: (path: string) => void;
}

const RESOURCE_TYPE_IDS = [
  'textbook', 'teacher_guide', 'workbook', 'revision_notes', 'summary_sheet',
  'past_paper', 'reader', 'interactive', 'activity_book',
];

export function LibraryUploadPage({ onNavigate }: LibraryUploadPageProps) {
  const [grades, setGrades] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [strands, setStrands] = useState<Array<{ id: string; name: string }>>([]);
  const [subStrands, setSubStrands] = useState<Array<{ id: string; name: string }>>([]);
  const [types, setTypes] = useState<Array<{ id: string; label: string }>>([]);
  const [myUploads, setMyUploads] = useState<Array<{ id: string; title: string; resource_type: string; status: string; grade_name: string; subject_name: string; created_at: string }>>([]);

  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [strandId, setStrandId] = useState('');
  const [subStrandId, setSubStrandId] = useState('');
  const [resourceType, setResourceType] = useState('textbook');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [filePath, setFilePath] = useState('');
  const [markingSchemeUrl, setMarkingSchemeUrl] = useState('');
  const [examinerNotes, setExaminerNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMeta = useCallback(async () => {
    if (!hasBackend()) return;
    try {
      const [g, s, t] = await Promise.all([apiGrades(), apiSubjects(), apiLibraryTypes()]);
      setGrades(g);
      setSubjects(s);
      setTypes(t.length ? t : RESOURCE_TYPE_IDS.map((id) => ({ id, label: id.replace(/_/g, ' ') })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!hasBackend() || (!gradeId && !subjectId)) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await apiStrands({ grade_id: gradeId || undefined, subject_id: subjectId || undefined });
        if (!cancelled) setStrands(list);
      } catch {
        if (!cancelled) setStrands([]);
      }
    })();
    return () => { cancelled = true; };
  }, [gradeId, subjectId]);

  useEffect(() => {
    if (!hasBackend() || !strandId) {
      setSubStrands([]);
      return;
    }
    let cancelled = false;
    apiSubStrands(strandId).then((list) => {
      if (!cancelled) setSubStrands(list);
    }).catch(() => {
      if (!cancelled) setSubStrands([]);
    });
    return () => { cancelled = true; };
  }, [strandId]);

  const loadMyUploads = useCallback(async () => {
    if (!hasBackend()) return;
    try {
      const list = await apiLibraryMyUploads();
      setMyUploads(list);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadMyUploads();
  }, [loadMyUploads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBackend()) return;
    if (!gradeId || !subjectId || !title) {
      setError('Grade, subject and title are required.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiLibraryCreate({
        grade_id: gradeId,
        subject_id: subjectId,
        strand_id: strandId || undefined,
        sub_strand_id: subStrandId || undefined,
        resource_type: resourceType,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        page_count: pageCount ? parseInt(pageCount, 10) : undefined,
        file_path: filePath.trim() || undefined,
        marking_scheme_url: resourceType === 'past_paper' ? (markingSchemeUrl.trim() || undefined) : undefined,
        examiner_notes: resourceType === 'past_paper' ? (examinerNotes.trim() || undefined) : undefined,
      });
      setSuccess('Resource submitted. It will appear in the library after approval.');
      setTitle('');
      setDescription('');
      setTags('');
      setAuthor('');
      setPublisher('');
      setPageCount('');
      setFilePath('');
      setMarkingSchemeUrl('');
      setExaminerNotes('');
      loadMyUploads();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create resource');
    } finally {
      setLoading(false);
    }
  };

  if (!hasBackend()) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => onNavigate('/library')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
        <p className="text-amber-700">Backend required. Set VITE_API_URL and start the backend.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => onNavigate('/library')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Upload book</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                {success && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                    <select
                      value={gradeId}
                      onChange={(e) => setGradeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      required
                    >
                      <option value="">Select grade</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      required
                    >
                      <option value="">Select subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Strand</label>
                    <select
                      value={strandId}
                      onChange={(e) => { setStrandId(e.target.value); setSubStrandId(''); }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    >
                      <option value="">Optional</option>
                      {strands.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-strand</label>
                    <select
                      value={subStrandId}
                      onChange={(e) => setSubStrandId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    >
                      <option value="">Optional</option>
                      {subStrands.map((ss) => (
                        <option key={ss.id} value={ss.id}>{ss.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource type *</label>
                    <select
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    >
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      placeholder="e.g. Mathematics Grade 6 Learner's Book"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="Brief description of the resource"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                      placeholder="e.g. fractions, decimals"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page count</label>
                    <input
                      type="number"
                      min={1}
                      value={pageCount}
                      onChange={(e) => setPageCount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File path (optional)</label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="Path or URL after file is uploaded"
                  />
                </div>

                {resourceType === 'past_paper' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marking scheme URL</label>
                      <input
                        type="text"
                        value={markingSchemeUrl}
                        onChange={(e) => setMarkingSchemeUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        placeholder="URL or path to marking scheme"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Examiner notes</label>
                      <textarea
                        value={examinerNotes}
                        onChange={(e) => setExaminerNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        placeholder="Brief notes for learners"
                      />
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <Button type="submit" variant="primary" disabled={loading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? 'Submitting...' : 'Submit for approval'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardBody>
              <h3 className="font-semibold text-gray-900 mb-3">My uploads</h3>
              {myUploads.length === 0 ? (
                <p className="text-sm text-gray-500">No uploads yet. Resources you submit appear here; teacher uploads need admin approval.</p>
              ) : (
                <ul className="space-y-2">
                  {myUploads.map((u) => (
                    <li key={u.id} className="text-sm flex justify-between items-start gap-2">
                      <span className="font-medium text-gray-900 truncate">{u.title}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-xs ${u.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {u.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
