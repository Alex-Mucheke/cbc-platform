/**
 * Admin — Content approval: list pending library uploads, approve.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { hasBackend, apiAdminLibraryPending, apiAdminLibraryApprove } from '../../lib/api';

interface AdminLibraryPageProps {
  onNavigate: (path: string) => void;
}

interface PendingItem {
  id: string;
  title: string;
  resource_type: string;
  description: string | null;
  status: string;
  grade_name: string;
  subject_name: string;
  author: string | null;
  created_by_name: string | null;
  created_at: string;
}

function formatType(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminLibraryPage({ onNavigate }: AdminLibraryPageProps) {
  const [list, setList] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasBackend()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiAdminLibraryPending();
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pending');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    setError('');
    setApprovingId(id);
    try {
      await apiAdminLibraryApprove(id);
      setList((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  if (!hasBackend()) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => onNavigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <p className="text-amber-700">Backend required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => onNavigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Content approval</h1>
      </div>

      <p className="text-gray-600">Approve teacher uploads so they appear in the Digital Library.</p>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <Card>
        <CardBody>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-gray-500">No pending uploads.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {list.map((r) => (
                <li key={r.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-sm text-gray-600">
                      {r.grade_name} · {r.subject_name} · {formatType(r.resource_type)}
                      {r.created_by_name && ` · by ${r.created_by_name}`}
                    </p>
                    {r.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.description}</p>}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => approve(r.id)}
                    disabled={approvingId === r.id}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {approvingId === r.id ? 'Approving...' : 'Approve'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
