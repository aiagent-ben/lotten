"use client";

import { ImageUploader } from '@/components/admin/ImageUploader';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { MaterialSpecEditor } from '@/components/admin/MaterialSpecEditor';
import { ColorOptionEditor } from '@/components/admin/ColorOptionEditor';
import { ProductVariantEditor } from '@/components/admin/ProductVariantEditor';
import { useState, useEffect } from 'react';

interface FormData {
  // Basic Info
  article_no: string;
  name: string;
  slug: string;
  collection_id: string;
  short_description: string;
  description: string;
  
  // Pricing
  price_usd: string;
  cost_usd: string;
  moq: string;
  lead_time_weeks: string;
  
  // Dimensions
  width_mm: string;
  depth_mm: string;
  height_mm: string;
  weight_kg: string;
  volume_m3: string;
  pack_type: string;
  carton_length_mm: string;
  carton_width_mm: string;
  carton_height_mm: string;
  
  // Inventory
  stock_available: string;
  stock_reserved: string;
  stock_incoming: string;
  low_stock_threshold: string;
  
  // Status
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  sort_order: string;
  
  // Materials & Colors
  materials: string;
  colors: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const [formData, setFormData] = useState<FormData>({
    article_no: '',
    name: '',
    slug: '',
    collection_id: '',
    short_description: '',
    description: '',
    price_usd: '',
    cost_usd: '',
    moq: '1',
    lead_time_weeks: '8',
    width_mm: '',
    depth_mm: '',
    height_mm: '',
    weight_kg: '',
    volume_m3: '',
    pack_type: '1PC/CTN',
    carton_length_mm: '',
    carton_width_mm: '',
    carton_height_mm: '',
    stock_available: '0',
    stock_reserved: '0',
    stock_incoming: '0',
    low_stock_threshold: '5',
    is_active: true,
    is_new: false,
    is_bestseller: false,
    sort_order: '0',
    materials: JSON.stringify([
      { part: '', material: '', finish: '', code: '' },
    ], null, 2),
    colors: JSON.stringify([
      { part: '', name: '', code: '', hex: '#FFFFFF' },
    ], null, 2),
  });

  const [collections, setCollections] = useState<{id: string; name: string; slug: string}[]>([]);
  const [brands, setBrands] = useState<{id: string; name: string; slug: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [collectionsRes, brandsRes] = await Promise.all([
          fetch('/api/admin/collections'),
          fetch('/api/admin/brands'),
        ]);
        
        const collectionsData = await collectionsRes.json();
        const brandsData = await brandsRes.json();
        
        setCollections(collectionsData.data || []);
        setBrands(brandsData.data || []);
      } catch (error) {
        console.error('Failed to fetch collections/brands:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-gray-900">New Product</h1>
            <p className="body text-gray-600 mt-1">Add a new product to the catalog</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900">New Product</h1>
          <p className="body text-gray-600 mt-1">Add a new product to the catalog</p>
        </div>
      </div>

      <form className="card" action="#" method="POST" onSubmit={handleSubmit}>
        <div className="card-content space-y-8">
          
          {/* Basic Information */}
          <fieldset className="space-y-6">
            <legend className="form-section-title">Basic Information</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="article_no" className="label">Article Number *</label>
                <input
                  type="text"
                  id="article_no"
                  name="article_no"
                  value={formData.article_no}
                  onChange={handleChange}
                  placeholder="e.g., 335048"
                  className="input mt-1"
                  required
                />
                <p className="caption text-gray-500 mt-1">Unique article/SKU number from supplier</p>
              </div>
              
              <div>
                <label htmlFor="name" className="label">Product Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., BREDA 1.5M TV CABINET 109/167"
                  className="input mt-1"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="slug" className="label">Slug *</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="auto-generated from name"
                  className="input mt-1"
                  required
                />
                <p className="caption text-gray-500 mt-1">URL-friendly identifier (auto-generated if empty)</p>
              </div>
              
              <div>
                <label htmlFor="collection_id" className="label">Collection *</label>
                <select id="collection_id" name="collection_id" value={formData.collection_id} onChange={handleChange} className="input mt-1" required>
                  <option value="">Select a collection</option>
                  {collections?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="short_description" className="label">Short Description</label>
                <textarea
                  id="short_description"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Brief description for product cards and listings (max 200 chars)"
                  className="input mt-1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="label">Full Description</label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                placeholder="Rich text description with formatting..."
                readOnly={false}
              />
            </div>
          </fieldset>
          
          {/* Pricing */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Pricing</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label htmlFor="price_usd" className="label">Sale Price (MYR) *</label>
                <input
                  type="number"
                  id="price_usd"
                  name="price_usd"
                  value={formData.price_usd}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="899.00"
                  className="input mt-1"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="cost_usd" className="label">Cost Price (MYR)</label>
                <input
                  type="number"
                  id="cost_usd"
                  name="cost_usd"
                  value={formData.cost_usd}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="450.00"
                  className="input mt-1"
                />
                <p className="caption text-gray-500 mt-1">Internal use only</p>
              </div>
              
              <div>
                <label htmlFor="moq" className="label">MOQ</label>
                <input
                  type="number"
                  id="moq"
                  name="moq"
                  value={formData.moq}
                  onChange={handleChange}
                  min="1"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="lead_time_weeks" className="label">Lead Time (weeks)</label>
                <input
                  type="number"
                  id="lead_time_weeks"
                  name="lead_time_weeks"
                  value={formData.lead_time_weeks}
                  onChange={handleChange}
                  min="0"
                  className="input mt-1"
                />
              </div>
            </div>
          </fieldset>
          
          {/* Dimensions */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Dimensions & Weight</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="width_mm" className="label">Width (mm)</label>
                <input
                  type="number"
                  id="width_mm"
                  name="width_mm"
                  value={formData.width_mm}
                  onChange={handleChange}
                  min="0"
                  placeholder="1500"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="depth_mm" className="label">Depth (mm)</label>
                <input
                  type="number"
                  id="depth_mm"
                  name="depth_mm"
                  value={formData.depth_mm}
                  onChange={handleChange}
                  min="0"
                  placeholder="450"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="height_mm" className="label">Height (mm)</label>
                <input
                  type="number"
                  id="height_mm"
                  name="height_mm"
                  value={formData.height_mm}
                  onChange={handleChange}
                  min="0"
                  placeholder="500"
                  className="input mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="weight_kg" className="label">Weight (kg)</label>
                <input
                  type="number"
                  id="weight_kg"
                  name="weight_kg"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="33.30"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="volume_m3" className="label">Volume (m³)</label>
                <input
                  type="number"
                  id="volume_m3"
                  name="volume_m3"
                  value={formData.volume_m3}
                  onChange={handleChange}
                  step="0.0001"
                  min="0"
                  placeholder="0.3324"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="pack_type" className="label">Pack Type</label>
                <input
                  type="text"
                  id="pack_type"
                  name="pack_type"
                  value={formData.pack_type}
                  onChange={handleChange}
                  placeholder="1PC/CTN"
                  className="input mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="carton_length_mm" className="label">Carton Length (mm)</label>
                <input
                  type="number"
                  id="carton_length_mm"
                  name="carton_length_mm"
                  value={formData.carton_length_mm}
                  onChange={handleChange}
                  min="0"
                  placeholder="1550"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="carton_width_mm" className="label">Carton Width (mm)</label>
                <input
                  type="number"
                  id="carton_width_mm"
                  name="carton_width_mm"
                  value={formData.carton_width_mm}
                  onChange={handleChange}
                  min="0"
                  placeholder="514"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="carton_height_mm" className="label">Carton Height (mm)</label>
                <input
                  type="number"
                  id="carton_height_mm"
                  name="carton_height_mm"
                  value={formData.carton_height_mm}
                  onChange={handleChange}
                  min="0"
                  placeholder="432"
                  className="input mt-1"
                />
              </div>
            </div>
          </fieldset>
          
          {/* Inventory */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Inventory</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label htmlFor="stock_available" className="label">Available Stock</label>
                <input
                  type="number"
                  id="stock_available"
                  name="stock_available"
                  value={formData.stock_available}
                  onChange={handleChange}
                  min="0"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="stock_reserved" className="label">Reserved</label>
                <input
                  type="number"
                  id="stock_reserved"
                  name="stock_reserved"
                  value={formData.stock_reserved}
                  onChange={handleChange}
                  min="0"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="stock_incoming" className="label">Incoming</label>
                <input
                  type="number"
                  id="stock_incoming"
                  name="stock_incoming"
                  value={formData.stock_incoming}
                  onChange={handleChange}
                  min="0"
                  className="input mt-1"
                />
              </div>
              
              <div>
                <label htmlFor="low_stock_threshold" className="label">Low Stock Threshold</label>
                <input
                  type="number"
                  id="low_stock_threshold"
                  name="low_stock_threshold"
                  value={formData.low_stock_threshold}
                  onChange={handleChange}
                  min="1"
                  className="input mt-1"
                />
              </div>
            </div>
          </fieldset>
          
          {/* Status */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Status & Display</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="label mb-0">Active</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_new"
                  name="is_new"
                  checked={formData.is_new}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_new" className="label mb-0">New Arrival</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_bestseller"
                  name="is_bestseller"
                  checked={formData.is_bestseller}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_bestseller" className="label mb-0">Bestseller</label>
              </div>
              
              <div>
                <label htmlFor="sort_order" className="label">Sort Order</label>
                <input
                  type="number"
                  id="sort_order"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleChange}
                  min="0"
                  className="input mt-1"
                />
              </div>
            </div>
          </fieldset>
          
          {/* Materials & Colors */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Materials & Colors</legend>
            
            <div className="space-y-6">
              <MaterialSpecEditor
                value={JSON.parse(formData.materials || '[]')}
                onChange={(value) => setFormData(prev => ({ ...prev, materials: JSON.stringify(value, null, 2) }))}
                label="Materials & Finishes"
              />
              
              <ColorOptionEditor
                value={JSON.parse(formData.colors || '[]')}
                onChange={(value) => setFormData(prev => ({ ...prev, colors: JSON.stringify(value, null, 2) }))}
                label="Color Options"
              />
            </div>
          </fieldset>
          
          {/* Images */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Product Images</legend>
            <ImageUploader
              productId=""
              initialImages={[]}
              onChange={(images) => setFormData(prev => ({ ...prev, images: JSON.stringify(images, null, 2) }))}
            />
          </fieldset>
          
          {/* Variants */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Product Variants</legend>
            <ProductVariantEditor
              value={[]}
              onChange={(variants) => setFormData(prev => ({ ...prev, variants: JSON.stringify(variants, null, 2) }))}
            />
          </fieldset>
          
          {/* Actions */}
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
            <a href="/admin/products" className="btn-secondary">Cancel</a>
            <button type="submit" className="btn-primary">
              Create Product
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}