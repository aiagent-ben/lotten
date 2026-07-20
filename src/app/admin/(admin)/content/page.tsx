"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Calendar, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  type: 'blog' | 'guide' | 'lookbook' | 'page';
  status: 'draft' | 'published' | 'scheduled';
  featured_image_url: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string | null;
}

interface ContentResponse {
  data: ContentPage[];
  count: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export default function ContentPage() {
  const router = useRouter();
  const [content, setContent] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        perPage: '20',
      });
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/content?${params.toString()}`);
      const result: ContentResponse = await response.json();

      if (result.data) {
        setContent(result.data);
        setTotalCount(result.count);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [currentPage, typeFilter, statusFilter, search]);

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      scheduled: 'bg-amber-100 text-amber-700',
    };
    return <span className={cn('badge text-xs px-2 py-1', styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700')}>{status}</span>;
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      blog: 'bg-blue-100 text-blue-700',
      guide: 'bg-purple-100 text-purple-700',
      lookbook: 'bg-pink-100 text-pink-700',
      page: 'bg-gray-100 text-gray-700',
    };
    return <span className={cn('badge text-xs px-2 py-1', styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-700')}>{type}</span>;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchContent();
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900">Content Management</h1>
          <p className="body text-gray-600 mt-1">Manage blog posts, guides, lookbooks, and static pages</p>
        </div>
        <Link href="/admin/content/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Content
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">All Types</option>
              <option value="blog">Blog</option>
              <option value="guide">Guide</option>
              <option value="lookbook">Lookbook</option>
              <option value="page">Page</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : content.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No content found. <Link href="/admin/content/new" className="text-primary hover:underline">Create your first content</Link>
                  </td>
                </tr>
              ) : (
                content.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{item.slug}</p>
                        {item.excerpt && <p className="text-xs text-gray-400 truncate max-w-xs mt-1">{item.excerpt}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-4">{getTypeBadge(item.type)}</td>
                    <td className="px-4 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {item.published_at ? format(new Date(item.published_at), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/content/${item.id}/edit`} className="btn-ghost btn-sm" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link href={`/${item.type === 'page' ? '' : item.type}/${item.slug}`} target="_blank" className="btn-ghost btn-sm" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn-ghost btn-sm text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}