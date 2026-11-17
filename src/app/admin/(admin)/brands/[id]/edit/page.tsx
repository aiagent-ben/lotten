"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { LocaleTabsBar, type AdminEditLocale } from '@/components/admin/LocaleTabsBar';
import type { BrandTranslation, LocaleTranslations } from '@/lib/types/database';

export default function EditBrandPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params?.id as string | undefined;

  const [activeLocale, setActiveLocale] = useState<AdminEditLocale>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [translations, setTranslations] = useState<LocaleTranslations<BrandTranslation>>({});

  useEffect(() => {
    if (!brandId) return;
    fetch(`/api/admin/brands/${brandId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setName(json.data.name || '');
          setDescription(json.data.description || '');
          setTranslations(json.data.translations || {});
        } else {
          setError(json.error || 'Brand not found');
        }
      })
      .catch(() => setError('Failed to load brand'))
      .finally(() => setLoading(false));
  }, [brandId]);

  const activeTr = activeLocale === 'en' ? {} : translations[activeLocale] || {};

  const updateTr = (field: keyof BrandTranslation, value: string) => {
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
    if (!brandId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, translations }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save brand');
      }
      router.push('/admin/collections');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand');
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
          <h1 className="heading-2 text-gray-900">Edit Brand</h1>
          <p className="body text-gray-600 mt-1">Manage brand details and translations</p>
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
              placeholder={activeLocale === 'en' ? 'Brand name' : name}
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
              placeholder={activeLocale === 'en' ? 'Brand description' : description}
              className="textarea input mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/admin/collections" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Brand'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
