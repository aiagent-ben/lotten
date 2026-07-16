"use client";

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit, Trash2, Search, Filter, ChevronLeft, ChevronRight, Calendar, Tag, Percent, DollarSign, Truck, X, Check, AlertCircle, Clock } from 'lucide-react';

interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  applicable_collections: string[] | null;
  applicable_products: string[] | null;
  applicable_categories: string[] | null;
  customer_segments: string[] | null;
  first_order_only: boolean;
  created_at: string;
  updated_at: string;
}

export default function DiscountsPage() {
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [perPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState<Partial<DiscountCode>>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    min_order_amount: null,
    max_discount_amount: null,
    usage_limit: null,
    usage_limit_per_customer: 1,
    valid_from: '',
    valid_until: '',
    is_active: true,
    applicable_collections: [],
    applicable_products: [],
    applicable_categories: [],
    customer_segments: [],
    first_order_only: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDiscounts();
  }, [page, search, statusFilter, typeFilter]);

  const fetchDiscounts = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
      });
      
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      
      const response = await fetch(`/api/admin/discounts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.data || []);
        setCount(data.count || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const url = editingDiscount ? `/api/admin/discounts/${editingDiscount.id}` : '/api/admin/discounts';
      const method = editingDiscount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save discount');
      }
      
      setShowModal(false);
      setEditingDiscount(null);
      fetchDiscounts();
    } catch (error) {
      console.error('Failed to save discount:', error);
      alert('Failed to save discount');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      name: discount.name,
      description: discount.description || '',
      type: discount.type,
      value: discount.value,
      min_order_amount: discount.min_order_amount,
      max_discount_amount: discount.max_discount_amount,
      usage_limit: discount.usage_limit,
      usage_limit_per_customer: discount.usage_limit_per_customer,
      valid_from: discount.valid_from.split('T')[0],
      valid_until: discount.valid_until.split('T')[0],
      is_active: discount.is_active,
      applicable_collections: discount.applicable_collections || [],
      applicable_products: discount.applicable_products || [],
      applicable_categories: discount.applicable_categories || [],
      customer_segments: discount.customer_segments || [],
      first_order_only: discount.first_order_only,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingDiscount(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      min_order_amount: null,
      max_discount_amount: null,
      usage_limit: null,
      usage_limit_per_customer: 1,
      valid_from: '',
      valid_until: '',
      is_active: true,
      applicable_collections: [],
      applicable_products: [],
      applicable_categories: [],
      customer_segments: [],
      first_order_only: false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    
    try {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      fetchDiscounts();
    } catch (error) {
      console.error('Failed to delete discount:', error);
      alert('Failed to delete discount');
    }
  };

  const getStatusBadge = (discount: DiscountCode) => {
    const now = new Date();
    const validFrom = new Date(discount.valid_from);
    const validUntil = new Date(discount.valid_until);
    
    if (!discount.is_active) {
      return <span className="badge-secondary">Inactive</span>;
    }
    
    if (validFrom > now) {
      return <span className="badge-info">Upcoming</span>;
    }
    
    if (validUntil < now) {
      return <span className="badge-secondary">Expired</span>;
    }
    
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return <span className="badge-warning">Limit Reached</span>;
    }
    
    return <span className="badge-primary">Active</span>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="w-4 h-4" />;
      case 'fixed_amount': return <DollarSign className="w-4 h-4" />;
      case 'free_shipping': return <Truck className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-gray-900">Discount Codes</h1>
            <p className="body text-gray-600 mt-1">Manage promotional discount codes</p>
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
          <h1 className="heading-2 text-gray-900">Discount Codes</h1>
          <p className="body text-gray-600 mt-1">Manage promotional discount codes</p>
        </div>
        <button onClick={handleNew} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Discount Code
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code or name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input pl-10 w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="input"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="upcoming">Upcoming</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="input"
              >
                <option value="">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="card">
        <div className="card-content p-0">
          {discounts.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No discount codes found</h3>
              <p className="mt-1 text-gray-500">Create your first discount code to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {discounts.map((discount) => (
                      <tr key={discount.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-primary">{discount.code}</code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{discount.name}</div>
                          {discount.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{discount.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(discount.type)}
                            <span className="capitalize text-sm text-gray-700">{discount.type.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {discount.type === 'percentage' ? `${discount.value}%` : 
                           discount.type === 'fixed_amount' ? formatPrice(discount.value) : 'Free Shipping'}
                          {discount.min_order_amount && (
                            <div className="text-xs text-gray-500">Min: {formatPrice(discount.min_order_amount)}</div>
                          )}
                          {discount.max_discount_amount && discount.type === 'percentage' && (
                            <div className="text-xs text-gray-500">Max: {formatPrice(discount.max_discount_amount)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(discount.valid_from).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>to {new Date(discount.valid_until).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {discount.usage_limit ? `${discount.used_count} / ${discount.usage_limit}` : `${discount.used_count} used`}
                          <div className="text-xs text-gray-500">Per customer: {discount.usage_limit_per_customer}</div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(discount)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(discount)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(discount.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {(count ?? 0) > perPage && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, count ?? 0)} of {count ?? 0} discounts
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="heading-3 text-gray-900">{editingDiscount ? 'Edit Discount Code' : 'New Discount Code'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <fieldset className="space-y-4">
                  <legend className="form-section-title">Basic Information</legend>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="code" className="label">Code</label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        value={formData.code || ''}
                        onChange={handleChange}
                        placeholder="AUTO-GENERATED"
                        className="input mt-1"
                        readOnly={!editingDiscount}
                      />
                      <p className="caption text-gray-500 mt-1">Leave empty to auto-generate</p>
                    </div>
                    
                    <div>
                      <label htmlFor="name" className="label">Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        placeholder="Summer Sale 2024"
                        className="input mt-1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="label">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Internal description of this discount"
                      className="input mt-1"
                    />
                  </div>
                </fieldset>
                
                {/* Discount Type & Value */}
                <fieldset className="space-y-4 border-t border-gray-100 pt-4">
                  <legend className="form-section-title">Discount Configuration</legend>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="type" className="label">Type *</label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type || 'percentage'}
                        onChange={handleChange}
                        className="input mt-1"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed_amount">Fixed Amount (MYR)</option>
                        <option value="free_shipping">Free Shipping</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="value" className="label">Value *</label>
                      <input
                        type="number"
                        id="value"
                        name="value"
                        value={formData.value || 0}
                        onChange={handleChange}
                        step={formData.type === 'percentage' ? '0.1' : '0.01'}
                        min={formData.type === 'percentage' ? '0' : '0.01'}
                        max={formData.type === 'percentage' ? '100' : undefined}
                        className="input mt-1"
                        required
                        disabled={formData.type === 'free_shipping'}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="checkbox"
                          id="first_order_only"
                          name="first_order_only"
                          checked={formData.first_order_only || false}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="first_order_only" className="label mb-0">First order only</label>
                      </div>
                    </div>
                  </div>
                  
                  {formData.type !== 'free_shipping' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="min_order_amount" className="label">Minimum Order Amount</label>
                        <input
                          type="number"
                          id="min_order_amount"
                          name="min_order_amount"
                          value={formData.min_order_amount || ''}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="input mt-1"
                        />
                        <p className="caption text-gray-500 mt-1">Leave empty for no minimum</p>
                      </div>
                      
                      {formData.type === 'percentage' && (
                        <div>
                          <label htmlFor="max_discount_amount" className="label">Maximum Discount Amount</label>
                          <input
                            type="number"
                            id="max_discount_amount"
                            name="max_discount_amount"
                            value={formData.max_discount_amount || ''}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="input mt-1"
                          />
                          <p className="caption text-gray-500 mt-1">Cap the maximum discount value</p>
                        </div>
                      )}
                    </div>
                  )}
                </fieldset>
                
                {/* Usage Limits */}
                <fieldset className="space-y-4 border-t border-gray-100 pt-4">
                  <legend className="form-section-title">Usage Limits</legend>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="usage_limit" className="label">Total Usage Limit</label>
                      <input
                        type="number"
                        id="usage_limit"
                        name="usage_limit"
                        value={formData.usage_limit || ''}
                        onChange={handleChange}
                        min="1"
                        placeholder="Unlimited"
                        className="input mt-1"
                      />
                      <p className="caption text-gray-500 mt-1">Total times this code can be used</p>
                    </div>
                    
                    <div>
                      <label htmlFor="usage_limit_per_customer" className="label">Per Customer Limit</label>
                      <input
                        type="number"
                        id="usage_limit_per_customer"
                        name="usage_limit_per_customer"
                        value={formData.usage_limit_per_customer || 1}
                        onChange={handleChange}
                        min="1"
                        className="input mt-1"
                      />
                    </div>
                  </div>
                </fieldset>
                
                {/* Validity Period */}
                <fieldset className="space-y-4 border-t border-gray-100 pt-4">
                  <legend className="form-section-title">Validity Period</legend>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="valid_from" className="label">Valid From *</label>
                      <input
                        type="date"
                        id="valid_from"
                        name="valid_from"
                        value={formData.valid_from || ''}
                        onChange={handleChange}
                        className="input mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="valid_until" className="label">Valid Until *</label>
                      <input
                        type="date"
                        id="valid_until"
                        name="valid_until"
                        value={formData.valid_until || ''}
                        onChange={handleChange}
                        className="input mt-1"
                        required
                      />
                    </div>
                  </div>
                </fieldset>
                
                {/* Status */}
                <fieldset className="space-y-4 border-t border-gray-100 pt-4">
                  <legend className="form-section-title">Status</legend>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active !== false}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="is_active" className="label mb-0">Active</label>
                  </div>
                </fieldset>
                
                {/* Actions */}
                <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row gap-4 justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : (editingDiscount ? 'Save Changes' : 'Create Discount')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}