"use client";

import { useState, type KeyboardEvent } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { POPULAR_CATEGORY_SUGGESTIONS } from '@/lib/constants/categories';
import { matchCanonicalCategory } from '@/lib/categories';

interface CategoryTagPickerProps {
  categories: string[];
  onChange: (categories: string[]) => void;
  disabled?: boolean;
}

export function CategoryTagPicker({
  categories = [],
  onChange,
  disabled = false,
}: CategoryTagPickerProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (rawTag: string) => {
    const cleaned = matchCanonicalCategory(rawTag);
    if (!cleaned) return;

    // Check if already exists (case-insensitive)
    const exists = categories.some((c) => c.toLowerCase() === cleaned.toLowerCase());
    if (!exists) {
      onChange([...categories, cleaned]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(categories.filter((c) => c !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-gray-500" />
        <label className="text-sm font-medium text-gray-700">Categories &amp; Tags</label>
      </div>

      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 min-h-[36px] p-2 border border-gray-300 rounded-lg bg-gray-50/50">
        {categories.length === 0 ? (
          <span className="text-xs text-gray-400 self-center">
            No categories selected. Pick from suggestions below or type a custom tag.
          </span>
        ) : (
          categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300"
            >
              {cat}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(cat)}
                  className="hover:text-amber-700 focus:outline-none"
                  aria-label={`Remove ${cat}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* Custom Tag Input */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type custom tag and press Enter (e.g. Sofa, Velvet, Ergonomic)..."
            className="input flex-1 text-sm py-1.5"
          />
          <button
            type="button"
            onClick={() => handleAddTag(inputValue)}
            disabled={!inputValue.trim()}
            className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tag
          </button>
        </div>
      )}

      {/* Popular Suggestions Chips */}
      {!disabled && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Quick Suggestions:</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_CATEGORY_SUGGESTIONS.map((suggestion) => {
              const isSelected = categories.some(
                (c) => c.toLowerCase() === suggestion.toLowerCase()
              );
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() =>
                    isSelected ? handleRemoveTag(suggestion) : handleAddTag(suggestion)
                  }
                  className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 font-medium'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {isSelected ? `✓ ${suggestion}` : `+ ${suggestion}`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
