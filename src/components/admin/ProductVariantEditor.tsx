"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariantAttribute {
  key: string;
  value: string;
}

interface ProductVariant {
  id?: string;
  article_no: string;
  name: string;
  slug: string;
  price_usd: string;
  stock_available: string;
  stock_reserved: string;
  stock_incoming: string;
  variant_attributes: Record<string, string>;
  is_active: boolean;
  sort_order: string;
}

interface ProductVariantEditorProps {
  value: ProductVariant[];
  onChange: (value: ProductVariant[]) => void;
  label?: string;
}

export function ProductVariantEditor({ 
  value, 
  onChange, 
  label = "Product Variants" 
}: ProductVariantEditorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(value);

  useEffect(() => {
    setVariants(value);
  }, [value]);

  const handleVariantsChange = (newVariants: ProductVariant[]) => {
    setVariants(newVariants);
    onChange(newVariants);
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      article_no: "",
      name: "",
      slug: "",
      price_usd: "0",
      stock_available: "0",
      stock_reserved: "0",
      stock_incoming: "0",
      variant_attributes: {},
      is_active: true,
      sort_order: String(variants.length),
    };
    handleVariantsChange([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    handleVariantsChange(newVariants);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    handleVariantsChange(newVariants);
  };

  const updateVariantAttribute = (index: number, attrKey: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      variant_attributes: {
        ...newVariants[index].variant_attributes,
        [attrKey]: value,
      },
    };
    handleVariantsChange(newVariants);
  };

  const addAttribute = (index: number) => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      variant_attributes: {
        ...newVariants[index].variant_attributes,
        "": "",
      },
    };
    handleVariantsChange(newVariants);
  };

  const removeAttribute = (index: number, attrKey: string) => {
    const newVariants = [...variants];
    const { [attrKey]: _, ...rest } = newVariants[index].variant_attributes;
    newVariants[index] = {
      ...newVariants[index],
      variant_attributes: rest,
    };
    handleVariantsChange(newVariants);
  };

  const moveVariant = (fromIndex: number, toIndex: number) => {
    const newVariants = [...variants];
    const [removed] = newVariants.splice(fromIndex, 1);
    newVariants.splice(toIndex, 0, removed);
    // Update sort_order
    newVariants.forEach((v, i) => {
      v.sort_order = String(i);
    });
    handleVariantsChange(newVariants);
  };

  if (variants.length === 0) {
    return (
      <div className="space-y-4">
        <label className="label">{label}</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No variants added yet</p>
          <button
            type="button"
            onClick={addVariant}
            className="btn-primary"
          >
            Add First Variant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="label">{label} ({variants.length})</label>
        <button
          type="button"
          onClick={addVariant}
          className="btn-secondary text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Variant
        </button>
      </div>

      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div
            key={variant.id || index}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                <span className="font-medium text-gray-900">
                  Variant {index + 1}
                  {variant.name && `: ${variant.name}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-red-500 hover:text-red-700"
                disabled={variants.length === 1}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Article Number *</label>
                  <input
                    type="text"
                    value={variant.article_no}
                    onChange={(e) => updateVariant(index, "article_no", e.target.value)}
                    placeholder="e.g., 335048-FAB-GRY"
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, "name", e.target.value)}
                    placeholder="e.g., Grey Linen Fabric"
                    className="input mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Slug *</label>
                  <input
                    type="text"
                    value={variant.slug}
                    onChange={(e) => updateVariant(index, "slug", e.target.value)}
                    placeholder="auto-generated from name"
                    className="input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="label">Price (MYR) *</label>
                  <input
                    type="number"
                    value={variant.price_usd}
                    onChange={(e) => updateVariant(index, "price_usd", e.target.value)}
                    step="0.01"
                    min="0"
                    className="input mt-1"
                    required
                  />
                </div>
              </div>

              {/* Inventory */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="label">Available Stock</label>
                  <input
                    type="number"
                    value={variant.stock_available}
                    onChange={(e) => updateVariant(index, "stock_available", e.target.value)}
                    min="0"
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="label">Reserved</label>
                  <input
                    type="number"
                    value={variant.stock_reserved}
                    onChange={(e) => updateVariant(index, "stock_reserved", e.target.value)}
                    min="0"
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="label">Incoming</label>
                  <input
                    type="number"
                    value={variant.stock_incoming}
                    onChange={(e) => updateVariant(index, "stock_incoming", e.target.value)}
                    min="0"
                    className="input mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 w-full">
                    <input
                      type="checkbox"
                      checked={variant.is_active}
                      onChange={(e) => updateVariant(index, "is_active", e.target.checked ? "true" : "false")}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="label mb-0">Active</span>
                  </label>
                </div>
              </div>

              {/* Variant Attributes */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Variant Attributes</h4>
                  <button
                                      type="button"
                                      onClick={() => addAttribute(index)}
                                      className="btn-secondary text-sm"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add Attribute
                                    </button>
                                  </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(variant.variant_attributes).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          if (newKey !== key) {
                            const newVariants = [...variants];
                            const attrs = { ...variants[index].variant_attributes };
                            delete attrs[key];
                            attrs[newKey] = value;
                            newVariants[index] = {
                              ...newVariants[index],
                              variant_attributes: attrs,
                            };
                            handleVariantsChange(newVariants);
                          }
                        }}
                        placeholder="Attribute name (e.g., fabric)"
                        className="input"
                      />
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateVariantAttribute(index, key, e.target.value)}
                          placeholder="Value (e.g., Grey Linen)"
                          className="input flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttribute(index, key)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductVariantEditor;