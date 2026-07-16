"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Pricing Display
    price_display_mode: 'MYR', // MYR | USD | BOTH
    show_cost_price: false,
    show_margin: false,
    tax_included: true,
    tax_rate: 0,
    
    // Stock Visibility
    show_stock_levels: true,
    show_low_stock_threshold: true,
    show_incoming_stock: false,
    stock_visibility: 'all', // all | authenticated | none
    allow_backorder: false,
    backorder_threshold: 0,
    
    // Currency
    default_currency: 'MYR',
    supported_currencies: ['MYR', 'USD', 'SGD', 'THB'] as string[],
    exchange_rates: { MYR: 1, USD: 0.21, SGD: 0.28, THB: 7.5 } as Record<string, number>,
    auto_update_rates: false,
    
    // Maintenance Mode
    maintenance_mode: false,
    maintenance_message: 'We are currently performing scheduled maintenance. Please check back soon.',
    maintenance_allowed_ips: '',
    maintenance_start: '',
    maintenance_end: '',
    
    // General
    site_name: 'Lotten',
    site_tagline: 'Premium Furniture Marketplace',
    contact_email: 'info@lotten.com',
    support_email: 'support@lotten.com',
    company_name: 'Lotten Sdn Bhd',
    company_address: 'Kuala Lumpur, Malaysia',
    company_phone: '+60 3-xxxx-xxxx',
    company_registration: 'XXXXXX-X',
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setSettings(prev => ({ ...prev, ...data.data }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-gray-900">Settings</h1>
            <p className="body text-gray-600 mt-1">Manage site configuration</p>
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
          <h1 className="heading-2 text-gray-900">Settings</h1>
          <p className="body text-gray-600 mt-1">Manage site configuration</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="card-content space-y-8">
          
          {/* Pricing Display */}
          <fieldset className="space-y-6">
            <legend className="form-section-title">Pricing Display</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="price_display_mode" className="label">Price Display Mode</label>
                <select id="price_display_mode" name="price_display_mode" value={settings.price_display_mode} onChange={handleChange} className="input mt-1">
                  <option value="MYR">MYR Only</option>
                  <option value="USD">USD Only</option>
                  <option value="BOTH">Both MYR & USD</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="default_currency" className="label">Default Currency</label>
                <select id="default_currency" name="default_currency" value={settings.default_currency} onChange={handleChange} className="input mt-1">
                  <option value="MYR">MYR (Malaysian Ringgit)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="SGD">SGD (Singapore Dollar)</option>
                  <option value="THB">THB (Thai Baht)</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <input type="checkbox" id="show_cost_price" name="show_cost_price" checked={settings.show_cost_price} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="show_cost_price" className="label mb-0">Show Cost Price (Admin Only)</label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <input type="checkbox" id="show_margin" name="show_margin" checked={settings.show_margin} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="show_margin" className="label mb-0">Show Margin % (Admin Only)</label>
                </div>
              </div>
              
              <div className="flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <input type="checkbox" id="tax_included" name="tax_included" checked={settings.tax_included} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="tax_included" className="label mb-0">Prices Include Tax</label>
                </div>
              </div>
              
              <div>
                <label htmlFor="tax_rate" className="label">Tax Rate (%)</label>
                <input type="number" id="tax_rate" name="tax_rate" value={settings.tax_rate} onChange={handleChange} step="0.01" min="0" max="100" className="input mt-1" />
              </div>
            </div>
          </fieldset>
          
          {/* Stock Visibility */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Stock Visibility</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <input type="checkbox" id="show_stock_levels" name="show_stock_levels" checked={settings.show_stock_levels} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="show_stock_levels" className="label mb-0">Show Stock Levels</label>
                </div>
              </div>
              
              <div className="flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <input type="checkbox" id="show_low_stock_threshold" name="show_low_stock_threshold" checked={settings.show_low_stock_threshold} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="show_low_stock_threshold" className="label mb-0">Show Low Stock Alerts</label>
                </div>
              </div>
              
              <div className="flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <input type="checkbox" id="show_incoming_stock" name="show_incoming_stock" checked={settings.show_incoming_stock} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="show_incoming_stock" className="label mb-0">Show Incoming Stock</label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="stock_visibility" className="label">Stock Visibility</label>
                <select id="stock_visibility" name="stock_visibility" value={settings.stock_visibility} onChange={handleChange} className="input mt-1">
                  <option value="all">Everyone (Public)</option>
                  <option value="authenticated">Logged-in Users Only</option>
                  <option value="none">Hidden (Admin Only)</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <input type="checkbox" id="allow_backorder" name="allow_backorder" checked={settings.allow_backorder} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="allow_backorder" className="label mb-0">Allow Backorders</label>
                </div>
              </div>
              
              <div>
                <label htmlFor="backorder_threshold" className="label">Backorder Threshold</label>
                <input type="number" id="backorder_threshold" name="backorder_threshold" value={settings.backorder_threshold} onChange={handleChange} min="0" className="input mt-1" />
              </div>
            </div>
          </fieldset>
          
          {/* Currency Settings */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Currency Settings</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {settings.supported_currencies.map((curr: string, idx: number) => (
                <div key={curr} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{curr}</h4>
                    {curr !== 'MYR' && (
                      <button type="button" className="text-red-500 hover:text-red-700 text-sm" onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          supported_currencies: prev.supported_currencies.filter(c => c !== curr),
                          exchange_rates: Object.fromEntries(Object.entries(prev.exchange_rates).filter(([k]) => k !== curr))
                        }));
                      }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <label htmlFor={`rate_${curr}`} className="label">Exchange Rate (1 {curr} = MYR)</label>
                  <input
                    type="number"
                    id={`rate_${curr}`}
                    name={`rate_${curr}`}
                    value={settings.exchange_rates[curr] ?? ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      exchange_rates: { ...prev.exchange_rates, [curr]: parseFloat(e.target.value) || 0 }
                    }))}
                    step="0.0001"
                    min="0"
                    className="input mt-1"
                    disabled={curr === 'MYR'}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => {
                const newCurr = prompt('Enter currency code (e.g., EUR, GBP, JPY):');
                if (newCurr && newCurr.trim()) {
                  const upper = newCurr.trim().toUpperCase();
                  if (!settings.supported_currencies.includes(upper)) {
                    setSettings(prev => ({
                      ...prev,
                      supported_currencies: [...prev.supported_currencies, upper],
                      exchange_rates: { ...prev.exchange_rates, [upper]: 1 }
                    }));
                  }
                }
              }} className="btn-secondary text-sm">
                + Add Currency
              </button>
              
              <div className="flex items-center gap-2 ml-4">
                <input type="checkbox" id="auto_update_rates" name="auto_update_rates" checked={settings.auto_update_rates} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="auto_update_rates" className="label mb-0">Auto-update exchange rates daily</label>
              </div>
            </div>
          </fieldset>
          
          {/* Maintenance Mode */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">Maintenance Mode</legend>
            
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" id="maintenance_mode" name="maintenance_mode" checked={settings.maintenance_mode} onChange={handleChange} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="maintenance_mode" className="label mb-0 text-lg">Enable Maintenance Mode</label>
            </div>
            
            {settings.maintenance_mode && (
              <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="maintenance_message" className="label">Maintenance Message</label>
                    <textarea
                      id="maintenance_message"
                      name="maintenance_message"
                      value={settings.maintenance_message}
                      onChange={handleChange}
                      rows={3}
                      className="input mt-1"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="maintenance_allowed_ips" className="label">Allowed IPs (comma-separated)</label>
                      <input
                        type="text"
                        id="maintenance_allowed_ips"
                        name="maintenance_allowed_ips"
                        value={settings.maintenance_allowed_ips}
                        onChange={handleChange}
                        placeholder="192.168.1.1, 10.0.0.1"
                        className="input mt-1"
                      />
                      <p className="caption text-gray-500 mt-1">These IPs can bypass maintenance mode</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="maintenance_start" className="label">Maintenance Start</label>
                        <input type="datetime-local" id="maintenance_start" name="maintenance_start" value={settings.maintenance_start} onChange={handleChange} className="input mt-1" />
                      </div>
                      <div>
                        <label htmlFor="maintenance_end" className="label">Maintenance End</label>
                        <input type="datetime-local" id="maintenance_end" name="maintenance_end" value={settings.maintenance_end} onChange={handleChange} className="input mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <span className="text-amber-800 font-medium">Maintenance mode is active. The site will be inaccessible to visitors except allowed IPs.</span>
                </div>
              </div>
            )}
          </fieldset>
          
          {/* General Settings */}
          <fieldset className="space-y-6 border-t border-gray-100 pt-6">
            <legend className="form-section-title">General Settings</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="site_name" className="label">Site Name</label>
                <input type="text" id="site_name" name="site_name" value={settings.site_name} onChange={handleChange} className="input mt-1" />
              </div>
              
              <div>
                <label htmlFor="site_tagline" className="label">Site Tagline</label>
                <input type="text" id="site_tagline" name="site_tagline" value={settings.site_tagline} onChange={handleChange} className="input mt-1" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contact_email" className="label">Contact Email</label>
                <input type="email" id="contact_email" name="contact_email" value={settings.contact_email} onChange={handleChange} className="input mt-1" />
              </div>
              
              <div>
                <label htmlFor="support_email" className="label">Support Email</label>
                <input type="email" id="support_email" name="support_email" value={settings.support_email} onChange={handleChange} className="input mt-1" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="company_name" className="label">Company Name</label>
                <input type="text" id="company_name" name="company_name" value={settings.company_name} onChange={handleChange} className="input mt-1" />
              </div>
              
              <div>
                <label htmlFor="company_phone" className="label">Company Phone</label>
                <input type="text" id="company_phone" name="company_phone" value={settings.company_phone} onChange={handleChange} className="input mt-1" />
              </div>
              
              <div>
                <label htmlFor="company_registration" className="label">Company Registration</label>
                <input type="text" id="company_registration" name="company_registration" value={settings.company_registration} onChange={handleChange} className="input mt-1" />
              </div>
            </div>
            
            <div>
              <label htmlFor="company_address" className="label">Company Address</label>
              <textarea id="company_address" name="company_address" value={settings.company_address} onChange={handleChange} rows={2} className="input mt-1" />
            </div>
          </fieldset>
          
          {/* Actions */}
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}