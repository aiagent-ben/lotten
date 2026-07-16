"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, Mail, User, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  auth_user_id: string | null;
  email: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  address: Record<string, unknown> | null;
  tax_id: string | null;
  credit_limit_usd: number | null;
  payment_terms_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomerFormData {
  email: string;
  company_name: string;
  contact_name: string;
  phone: string;
  tax_id: string;
  address: string;
  credit_limit_usd: string;
  payment_terms_days: string;
  is_active: boolean;
}

export default function CustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [perPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    contact_name: '',
    phone: '',
    tax_id: '',
    address: '',
    credit_limit_usd: '',
    payment_terms_days: '',
    is_active: true,
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
      });
      
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      
      const response = await fetch(`/api/admin/customers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
        setCount(data.count || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, statusFilter]);

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
    setSaving(true);
    
    try {
      const url = editingCustomer 
        ? `/api/admin/customers/${editingCustomer.id}`
        : '/api/admin/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save customer');
      }
      
      setShowModal(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      email: customer.email,
      company_name: customer.company_name || '',
      contact_name: customer.contact_name || '',
      phone: customer.phone || '',
      tax_id: customer.tax_id || '',
      address: customer.address || '',
      credit_limit_usd: customer.credit_limit_usd?.toString() || '',
      payment_terms_days: customer.payment_terms_days?.toString() || '',
      is_active: customer.is_active,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingCustomer(null);
    setFormData({
      email: '',
      company_name: '',
      contact_name: '',
      phone: '',
      tax_id: '',
      address: '',
      credit_limit_usd: '',
      payment_terms_days: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-gray-900">Customers</h1>
            <p className="body text-gray-600 mt-1">Manage customer accounts</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
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
          <h1 className="heading-2 text-gray-900">Customers</h1>
          <p className="body text-gray-600 mt-1">Manage customer accounts</p>
        </div>
        <button onClick={handleNew} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Customer
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
                placeholder="Search by email, name, company..."
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
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="card-content p-0">
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-gray-500">Create your first customer to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Mail className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.email}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{customer.contact_name || 'No contact name'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{customer.contact_name || '-'}</p>
                          {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{customer.company_name || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          )}>
                            {customer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
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
                    Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, count ?? 0)} of {count ?? 0} customers
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
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
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => { setShowModal(false); setEditingCustomer(null); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="heading-3 text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'New Customer'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); setEditingCustomer(null); }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="email" className="label">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="customer@example.com"
                      className="input mt-1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company_name" className="label">Company Name</label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Company name"
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact_name" className="label">Contact Name</label>
                    <input
                      type="text"
                      id="contact_name"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleChange}
                      placeholder="Contact person name"
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="label">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+60 12-345 6789"
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="tax_id" className="label">Tax ID</label>
                    <input
                      type="text"
                      id="tax_id"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleChange}
                      placeholder="Tax/VAT ID"
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="label">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Street, City, State, Postal Code, Country"
                    className="input mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="credit_limit_usd" className="label">Credit Limit (MYR)</label>
                    <input
                      type="number"
                      id="credit_limit_usd"
                      name="credit_limit_usd"
                      value={formData.credit_limit_usd}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="payment_terms_days" className="label">Payment Terms (days)</label>
                    <input
                      type="number"
                      id="payment_terms_days"
                      name="payment_terms_days"
                      value={formData.payment_terms_days}
                      onChange={handleChange}
                      min="0"
                      className="input mt-1"
                    />
                  </div>
                </div>

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

                <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingCustomer(null); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : (editingCustomer ? 'Save Changes' : 'Create Customer')}
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