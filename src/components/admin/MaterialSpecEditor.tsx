"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialSpec {
  part: string;
  material: string;
  finish: string;
  code: string;
}

interface MaterialSpecEditorProps {
  value: MaterialSpec[];
  onChange: (value: MaterialSpec[]) => void;
  label?: string;
}

export function MaterialSpecEditor({ value, onChange, label = "Materials & Finishes" }: MaterialSpecEditorProps) {
  const [materials, setMaterials] = useState<MaterialSpec[]>(value);

  useEffect(() => {
    setMaterials(value);
  }, [value]);

  useEffect(() => {
    onChange(materials);
  }, [materials, onChange]);

  const addMaterial = () => {
    setMaterials([...materials, { part: "", material: "", finish: "", code: "" }]);
  };

  const updateMaterial = (index: number, field: keyof MaterialSpec, newValue: string) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], [field]: newValue };
    setMaterials(newMaterials);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const moveMaterial = (fromIndex: number, toIndex: number) => {
    const newMaterials = [...materials];
    const [removed] = newMaterials.splice(fromIndex, 1);
    newMaterials.splice(toIndex, 0, removed);
    setMaterials(newMaterials);
  };

  return (
    <div className="space-y-4">
      <label className="label">{label}</label>
      
      {materials.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No materials defined yet</p>
          <button
            type="button"
            onClick={addMaterial}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Material
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material, index) => (
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
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="label text-xs">Part</label>
                  <input
                    type="text"
                    value={material.part}
                    onChange={(e) => updateMaterial(index, "part", e.target.value)}
                    placeholder="e.g., cabinet_leg"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">Material</label>
                  <input
                    type="text"
                    value={material.material}
                    onChange={(e) => updateMaterial(index, "material", e.target.value)}
                    placeholder="e.g., Malaysian Oak"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">Finish</label>
                  <input
                    type="text"
                    value={material.finish}
                    onChange={(e) => updateMaterial(index, "finish", e.target.value)}
                    placeholder="e.g., Cocoa"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">Code</label>
                  <input
                    type="text"
                    value={material.code}
                    onChange={(e) => updateMaterial(index, "code", e.target.value)}
                    placeholder="e.g., 109"
                    className="input text-sm"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => removeMaterial(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                aria-label="Remove material"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addMaterial}
            className="btn-outline btn-sm w-full"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Material
          </button>
        </div>
      )}
    </div>
  );
}

export default MaterialSpecEditor;