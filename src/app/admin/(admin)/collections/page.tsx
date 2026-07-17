import { Metadata } from 'next';
import { createServiceClient } from '@/lib/db/client';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Collections | Lotten Admin',
};

interface ColorPaletteItem {
  name: string;
  code: string;
  hex: string;
}

interface BrandData {
  id: string;
  name: string;
  slug: string;
}

export default async function CollectionsPage() {
  const supabase = createServiceClient();
  
  const { data: collections } = await supabase
    .from('collections')
    .select(`
      *,
      brands:brand_id (id, name, slug),
      products:products (id, is_active)
    `)
    .order('sort_order');
  
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900">Collections</h1>
          <p className="body text-gray-600 mt-1">Manage product collections and brands</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/collections/new" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Collection
          </Link>
          <Link href="/admin/brands/new" className="btn-outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Brand
          </Link>
        </div>
      </div>

      {/* Brands Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Brands</h2>
          <p className="card-description">Manage furniture brands</p>
        </div>
        <div className="card-content pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {brands?.map((brand) => (
              <Link key={brand.id} href={`/admin/brands/${brand.id}/edit`} className="card p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-700 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.429 5l-1.286 7.214A2 2 0 0116.143 14H5.857a2 2 0 01-1.971-1.786L4.571 5" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 17h4a2 2 0 002-2V7a2 2 0 00-2-2h-4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{brand.name}</p>
                    <p className="text-sm text-gray-500">{brand.slug}</p>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/admin/brands/new" className="card p-4 border-2 border-dashed border-gray-300 hover:border-primary hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-center h-20 text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="mt-2">Add Brand</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-16"></th>
                <th>Collection</th>
                <th>Brand</th>
                <th>Products</th>
                <th>Colors</th>
                <th className="text-center">Status</th>
                <th className="w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections?.map((collection) => {
                const productCount = collection.products?.length || 0;
                const activeProducts = collection.products?.filter((p: { is_active: boolean }) => p.is_active).length || 0;
                const colorCount = collection.color_palette?.length || 0;
                
                return (
                  <tr key={collection.id}>
                    <td className="px-4 py-3">
                                          {collection.hero_image_url && (
                                            <Image
                                              src={collection.hero_image_url}
                                              alt={collection.name}
                                              width={48}
                                              height={48}
                                              className="w-12 h-12 object-cover rounded-lg"
                                            />
                                          )}
                                        </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{collection.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{collection.slug}</p>
                        {collection.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-1">{collection.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/brands/${collection.brand_id}/edit`} className="text-primary hover:underline">
                        {collection.brands?.name || 'Unknown'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{activeProducts} / {productCount}</span>
                    </td>
                    <td className="px-4 py-3">
                                          <div className="flex flex-wrap gap-1">
                                            {collection.color_palette?.slice(0, 4).map((color: ColorPaletteItem, i: number) => (
                                              <span
                                                key={i}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                                                style={{ backgroundColor: color.hex + '20', borderColor: color.hex }}
                                              >
                                                <span className="w-2 h-2 rounded" style={{ backgroundColor: color.hex }} />
                                                {color.name}
                                              </span>
                                            ))}
                                            {colorCount > 4 && (
                                              <span className="text-xs text-gray-500 px-2">+{colorCount - 4} more</span>
                                            )}
                                          </div>
                                        </td>
                    <td className="px-4 py-3 text-center">
                      <span className={collection.is_active ? 'badge-success' : 'badge-destructive'}>
                        {collection.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link 
                          href={`/admin/collections/${collection.slug}/edit`}
                          className="btn-ghost btn-xs p-2 text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <Link 
                          href={`/collections/${collection.slug}`}
                          target="_blank"
                          className="btn-ghost btn-xs p-2 text-gray-600 hover:text-gray-900"
                          title="View on site"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!collections || collections.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="mt-2">No collections yet</p>
                    <p className="text-sm">Create your first collection to organize products</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}