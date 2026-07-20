"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Save, X, ChevronLeft, Calendar, Tag, Image, Globe, Search, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentFormData {
  title: string;
  slug: string;
  excerpt: string;
  type: 'blog' | 'guide' | 'lookbook' | 'page';
  status: 'draft' | 'published' | 'scheduled';
  body_mdx: string;
  featured_image_url: string;
  featured_image_alt: string;
  seo_title: string;
  seo_description: string;
  seo_og_image: string;
  published_at: string;
  scheduled_at: string;
  category: string;
  tags: string[];
  // Lookbook specific
  room_type: string;
  style_tags: string; // comma-separated string
  featured_products: string; // comma-separated string
  hotspots: string; // JSON string
}

interface ContentFormProps {
  isNew?: boolean;
}

export function ContentForm({ isNew = true }: ContentFormProps) {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    slug: '',
    excerpt: '',
    type: 'blog',
    status: 'draft',
    body_mdx: '',
    featured_image_url: '',
    featured_image_alt: '',
    seo_title: '',
    seo_description: '',
    seo_og_image: '',
    published_at: '',
    scheduled_at: '',
    category: '',
    tags: [],
    room_type: '',
    style_tags: '', // comma-separated
    featured_products: '', // comma-separated
    hotspots: '[]',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);

  // Load existing content if editing
  useEffect(() => {
    if (!isNew && contentId) {
      loadContent();
    }
  }, [isNew, contentId]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content/${contentId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const content = data.data;
          setFormData({
            title: content.title,
            slug: content.slug,
            excerpt: content.excerpt || '',
            type: content.type,
            status: content.status,
            body_mdx: content.body_mdx || '',
            featured_image_url: content.featured_image_url || '',
            featured_image_alt: content.featured_image_alt || '',
            seo_title: content.seo_title || '',
            seo_description: content.seo_description || '',
            seo_og_image: content.seo_og_image || '',
            published_at: content.published_at ? format(parseISO(content.published_at), 'yyyy-MM-dd') : '',
            scheduled_at: content.scheduled_at ? format(parseISO(content.scheduled_at), 'yyyy-MM-dd') : '',
            category: content.category || '',
            tags: content.tags || [],
            room_type: content.room_type || '',
            style_tags: content.style_tags?.join(', ') || '',
            featured_products: content.featured_products?.join(', ') || '',
            hotspots: content.hotspots ? JSON.stringify(content.hotspots, null, 2) : '[]',
          });
        }
      }
    } catch (err) {
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleStyleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, style_tags: e.target.value }));
  };

  const handleFeaturedProductsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, featured_products: e.target.value }));
  };

  const handleHotspotsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, hotspots: e.target.value }));
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, featured_image_url: imageUrl }));
    setShowImageUploader(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!formData.body_mdx.trim()) {
      setError('Content is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/admin/content' : `/api/admin/content/${contentId}`;

      const payload = {
        ...formData,
        tags: formData.tags || [],
        style_tags: formData.style_tags.split(',').map(t => t.trim()).filter(Boolean),
        featured_products: formData.featured_products.split(',').map(t => t.trim()).filter(Boolean),
        hotspots: JSON.parse(formData.hotspots || '[]'),
        published_at: formData.published_at || null,
        scheduled_at: formData.scheduled_at || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin/content');
        router.refresh();
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to save content');
      }
    } catch (err) {
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/content');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900">{isNew ? 'Create New Content' : 'Edit Content'}</h1>
          <p className="body text-gray-600 mt-1">
            {isNew ? 'Write and publish new content' : 'Update existing content'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/content" className="btn-secondary">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to List
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
        {/* Basic Information */}
        <fieldset className="space-y-6">
          <legend className="form-section-title">Basic Information</legend>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="label">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter content title"
                className="input mt-1"
                required
              />
            </div>

            <div>
              <label htmlFor="slug" className="label">Slug *</label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="auto-generated from title"
                className="input mt-1"
                required
              />
              <p className="caption text-gray-500 mt-1">URL-friendly identifier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="type" className="label">Content Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input mt-1"
              >
                <option value="blog">Blog Post</option>
                <option value="guide">Care Guide</option>
                <option value="lookbook">Lookbook</option>
                <option value="page">Static Page</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="label">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input mt-1"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="label">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., care-guide, styling-tips, trends"
                className="input mt-1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="excerpt" className="label">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={3}
              placeholder="Brief summary for cards and SEO (max 300 chars)"
              className="input mt-1"
              maxLength={300}
            />
          </div>
        </fieldset>

        {/* Content Editor */}
        <fieldset className="space-y-6 border-t border-gray-100 pt-6">
          <legend className="form-section-title">Content (MDX)</legend>
          <RichTextEditor
            value={formData.body_mdx}
            onChange={(value) => setFormData(prev => ({ ...prev, body_mdx: value }))}
            placeholder="Write your content in Markdown/MDX..."
          />
        </fieldset>

        {/* Media */}
        <fieldset className="space-y-6 border-t border-gray-100 pt-6">
          <legend className="form-section-title">Featured Image</legend>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="featured_image_url" className="label">Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="featured_image_url"
                  name="featured_image_url"
                  value={formData.featured_image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="input mt-1 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowImageUploader(true)}
                  className="btn-secondary mt-1"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Upload
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="featured_image_alt" className="label">Alt Text</label>
              <input
                type="text"
                id="featured_image_alt"
                name="featured_image_alt"
                value={formData.featured_image_alt}
                onChange={handleChange}
                placeholder="Describe the image for accessibility"
                className="input mt-1"
              />
            </div>
          </div>

          {formData.featured_image_url && (
            <div className="relative w-64 h-40 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={formData.featured_image_url}
                alt={formData.featured_image_alt}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </fieldset>

        {/* Tags */}
        <fieldset className="space-y-6 border-t border-gray-100 pt-6">
          <legend className="form-section-title">Tags & Categorization</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Tags</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                placeholder="tag1, tag2, tag3"
                className="input mt-1"
              />
              <p className="caption text-gray-500 mt-1">Comma-separated</p>
            </div>

            <div>
              <label className="label">Lookbook Style Tags</label>
              <input
                type="text"
                value={formData.style_tags}
                onChange={handleStyleTagsChange}
                placeholder="modern, scandinavian, minimalist"
                className="input mt-1"
              />
              <p className="caption text-gray-500 mt-1">Comma-separated (for lookbooks)</p>
            </div>

            <div className="md:col-span-2">
              <label className="label">Featured Products (Product IDs)</label>
              <input
                type="text"
                value={formData.featured_products}
                onChange={handleFeaturedProductsChange}
                placeholder="prod-123, prod-456, prod-789"
                className="input mt-1"
              />
              <p className="caption text-gray-500 mt-1">Comma-separated (for lookbooks)</p>
            </div>

            <div className="md:col-span-2">
              <label className="label">Hotspots (JSON)</label>
              <textarea
                value={formData.hotspots}
                onChange={handleHotspotsChange}
                rows={6}
                placeholder='[{"productId": "prod-123", "x": 50, "y": 30, "label": "Sofa", "tooltip": "Breda 3-Seater"}]'
                className="input mt-1 font-mono text-sm"
              />
              <p className="caption text-gray-500 mt-1">For lookbooks - clickable product hotspots on image</p>
            </div>
          </div>
        </fieldset>

        {/* SEO */}
        <fieldset className="space-y-6 border-t border-gray-100 pt-6">
          <legend className="form-section-title">SEO</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="seo_title" className="label">Meta Title</label>
              <input
                type="text"
                id="seo_title"
                name="seo_title"
                value={formData.seo_title}
                onChange={handleChange}
                placeholder="Defaults to content title"
                className="input mt-1"
              />
            </div>

            <div>
              <label htmlFor="seo_og_image" className="label">OG Image URL</label>
              <input
                type="text"
                id="seo_og_image"
                name="seo_og_image"
                value={formData.seo_og_image}
                onChange={handleChange}
                placeholder="https://example.com/og-image.jpg"
                className="input mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="seo_description" className="label">Meta Description</label>
              <textarea
                id="seo_description"
                name="seo_description"
                value={formData.seo_description}
                onChange={handleChange}
                rows={3}
                placeholder="Defaults to excerpt"
                className="input mt-1"
                maxLength={160}
              />
              <p className="caption text-gray-500 mt-1">Max 160 characters</p>
            </div>
          </div>
        </fieldset>

        {/* Publishing */}
        <fieldset className="space-y-6 border-t border-gray-100 pt-6">
          <legend className="form-section-title">Publishing</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="published_at" className="label">Published Date</label>
              <input
                type="date"
                id="published_at"
                name="published_at"
                value={formData.published_at}
                onChange={handleChange}
                className="input mt-1"
              />
              <p className="caption text-gray-500 mt-1">Set when content was/will be published</p>
            </div>

            <div>
              <label htmlFor="scheduled_at" className="label">Scheduled Date</label>
              <input
                type="date"
                id="scheduled_at"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleChange}
                className="input mt-1"
              />
              <p className="caption text-gray-500 mt-1">For scheduled posts</p>
            </div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
          <Link href="/admin/content" className="btn-secondary">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isNew ? 'Create Content' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Image Uploader Modal */}
      {showImageUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="heading-4">Upload Image</h2>
              <button onClick={() => setShowImageUploader(false)} className="btn-ghost">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ImageUploader onSelect={handleImageSelect} onClose={() => setShowImageUploader(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple ImageUploader component
function ImageUploader({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          onSelect(data.url);
        }
      } else {
        alert('Failed to upload image');
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn('border-2 border-dashed rounded-xl p-8 text-center transition-colors', dragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50')}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        disabled={uploading}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">Drag & drop an image or click to browse</p>
        <p className="caption text-gray-400">PNG, JPG, WebP up to 10MB</p>
      </label>
      {uploading && <div className="mt-4"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>}
    </div>
  );
}