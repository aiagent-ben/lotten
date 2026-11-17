"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { LocaleTabsBar, type AdminEditLocale } from '@/components/admin/LocaleTabsBar';
import type { CollectionTranslation, LocaleTranslations } from '@/lib/types/database';

export default function EditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const slugOrId = params?.slug as string | undefined;

  const [activeLocale, setActiveLocale] = useState<AdminEditLocale>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [translations, setTranslations] = useState<LocaleTranslations<CollectionTranslation>>({});

  useEffect(() => {
    if (!slugOrId) return;
    fetch(`/api/admin/collections/${slugOrId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setName(json.data.name || '');
          setDescription(json.data.description || '');
          setIsActive(json.data.is_active !== false);
          setTranslations(json.data.translations || {});
        } else {
          setError(json.error || 'Collection not found');
        }
      })
      .catch(() => setError('Failed to load collection'))
      .finally(() => setLoading(false));
  }, [slugOrId]);

  const activeTr = activeLocale === 'en' ? {} : translations[activeLocale] || {};

  const updateTr = (field: keyof CollectionTranslation, value: string) => {
    if (activeLocale === 'en') return;
    setTranslations((prev) => ({
      ...prev,
      [activeLocale]: {
        ...(prev[activeLocale] || {}),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugOrId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/collections/${slugOrId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, is_active: isActive, translations }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save collection');
      }
      router.push('/admin/collections');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2 text-gray-900">Edit Collection</h1>
          <p className="body text-gray-600 mt-1">Manage collection details and translations</p>
        </div>
        <Link href="/admin/collections" className="btn-secondary">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="card-content space-y-6">
          <LocaleTabsBar
            activeLocale={activeLocale}
            onChange={setActiveLocale}
            hasTranslation={(loc) => Boolean(translations[loc]?.name || translations[loc]?.description)}
          />

          <div>
            <label className="label">Name {activeLocale === 'en' ? '*' : `(${activeLocale.toUpperCase()})`}</label>
            <input
              type="text"
              value={activeLocale === 'en' ? name : (activeTr.name ?? '')}
              onChange={(e) => (activeLocale === 'en' ? setName(e.target.value) : updateTr('name', e.target.value))}
              placeholder={activeLocale === 'en' ? 'Collection name' : name}
              required={activeLocale === 'en'}
              className="input mt-1"
            />
          </div>

          <div>
            <label className="label">Description {activeLocale !== 'en' && `(${activeLocale.toUpperCase()})`}</label>
            <textarea
              rows={4}
              value={activeLocale === 'en' ? description : (activeTr.description ?? '')}
              onChange={(e) =>
                activeLocale === 'en' ? setDescription(e.target.value) : updateTr('description', e.target.value)
              }
              placeholder={activeLocale === 'en' ? 'Collection description' : description}
              className="textarea input mt-1"
            />
          </div>

          {activeLocale === 'en' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/admin/collections" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Collection'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
