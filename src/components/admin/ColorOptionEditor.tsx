"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorOption {
  part: string;
  name: string;
  code: string;
  hex: string;
}

interface ColorOptionEditorProps {
  value: ColorOption[];
  onChange: (value: ColorOption[]) => void;
  label?: string;
}

export function ColorOptionEditor({ value, onChange, label = "Color Options" }: ColorOptionEditorProps) {
  const [colors, setColors] = useState<ColorOption[]>(value);

  useEffect(() => {
    setColors(value);
  }, [value]);

  useEffect(() => {
    onChange(colors);
  }, [colors, onChange]);

  const addColor = () => {
    setColors([...colors, { part: "", name: "", code: "", hex: "#FFFFFF" }]);
  };

  const updateColor = (index: number, field: keyof ColorOption, newValue: string) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], [field]: newValue };
    setColors(newColors);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const moveColor = (fromIndex: number, toIndex: number) => {
    const newColors = [...colors];
    const [removed] = newColors.splice(fromIndex, 1);
    newColors.splice(toIndex, 0, removed);
    setColors(newColors);
  };

  return (
    <div className="space-y-4">
      <label className="label">{label}</label>
      
      {colors.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No color options defined yet</p>
          <button
            type="button"
            onClick={addColor}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Color
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {colors.map((color, index) => (
            <div
              key={index}
              className="card p-4 flex items-start gap-3"
            >
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded cursor-grab"
                onMouseDown={(e) => e.preventDefault()}
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
              </button>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="label text-xs">Part</label>
                  <input
                    type="text"
                    value={color.part}
                    onChange={(e) => updateColor(index, "part", e.target.value)}
                    placeholder="e.g., cabinet_leg"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">Name</label>
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => updateColor(index, "name", e.target.value)}
                    placeholder="e.g., Cocoa"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">Code</label>
                  <input
                    type="text"
                    value={color.code}
                    onChange={(e) => updateColor(index, "code", e.target.value)}
                    placeholder="e.g., 109"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">Hex Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(index, "hex", e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color.hex}
                      onChange={(e) => updateColor(index, "hex", e.target.value)}
                      placeholder="#FFFFFF"
                      className="input text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="label text-xs">Preview</label>
                  <div
                    className="w-10 h-10 rounded border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => removeColor(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                aria-label="Remove color"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addColor}
            className="btn-outline btn-sm w-full"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Color
          </button>
        </div>
      )}
    </div>
  );
}

export default ColorOptionEditor;