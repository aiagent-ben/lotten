"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Image as ImageIcon, Upload, X, ArrowUp, ArrowDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
}

interface ImageUploaderProps {
  productId?: string;
  initialImages?: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  disabled?: boolean;
}

export function ImageUploader({ productId, initialImages = [], onChange, disabled = false }: ImageUploaderProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  useEffect(() => {
    onChange(images);
  }, [images, onChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
    handleFiles(files);
  }, [disabled]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => file.type.startsWith("image/"));
    handleFiles(files);
    e.target.value = "";
  };

  const uploadToR2 = async (file: File, folder: string = "products"): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/admin/upload/image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return data.url;
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      // Upload each file to R2
      const newImages: ProductImage[] = await Promise.all(
        files.map(async (file, index) => {
          // Update progress for this file
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

          try {
            const url = await uploadToR2(file);

            // Get image dimensions
            const dimensions = await getImageDimensions(url);

            return {
              id: `img-${Date.now()}-${index}`,
              product_id: productId || "",
              url,
              alt_text: file.name,
              sort_order: images.length + index,
              is_primary: images.length === 0 && index === 0,
              width: dimensions.width,
              height: dimensions.height,
            } as ProductImage;
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            throw error;
          } finally {
            setUploadProgress(prev => {
              const next = { ...prev };
              delete next[file.name];
              return next;
            });
          }
        })
      );

      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // If removing primary, make first image primary
    if (images[index].is_primary && newImages.length > 0) {
      newImages[0] = { ...newImages[0], is_primary: true };
    }
    setImages(newImages);
  };

  const handlePrimaryChange = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    // Update sort_order
    newImages.forEach((img, i) => {
      img.sort_order = i;
    });
    setImages(newImages);
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < images.length) {
      handleReorder(index, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      <label className="label">Product Images</label>
      
      <div className={cn(
        "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
        dragActive ? "border-primary bg-primary-50" : "border-gray-300 hover:border-primary",
        disabled && "opacity-50 cursor-not-allowed"
      )}
        onDragOver={handleDrag}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <label htmlFor="image-upload" className="flex flex-col items-center gap-3 cursor-pointer">
          <div className="flex items-center gap-2 text-gray-500">
            <Upload className="w-8 h-8" />
            <span className="text-lg font-medium">Drag & drop images here</span>
          </div>
          <p className="text-sm text-gray-400">
            or click to browse. Supports: JPEG, PNG, WebP, AVIF. Max 10MB each.
          </p>
          {uploading && (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading {Object.keys(uploadProgress).length} image(s)...</span>
            </div>
          )}
        </label>
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Uploaded Images ({images.length})</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-gray-50">
                  <img
                    src={image.url}
                    alt={image.alt_text || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary badge */}
                  {image.is_primary && (
                    <span className="absolute top-2 left-2 badge badge-primary badge-sm">
                      <Check className="w-3 h-3 mr-1" />
                      Primary
                    </span>
                  )}
                  
                  {/* Sort order badge */}
                  <span className="absolute top-2 right-2 badge badge-gray badge-sm">
                    #{image.sort_order + 1}
                  </span>
                  
                  {/* Alt text indicator */}
                  {image.alt_text && (
                    <span className="absolute bottom-2 left-2 right-2 badge badge-secondary badge-sm truncate">
                      {image.alt_text}
                    </span>
                  )}
                </div>
                
                {/* Controls on hover */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, "up")}
                      className="p-2 bg-white/90 rounded hover:bg-white transition-colors"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, "down")}
                      className="p-2 bg-white/90 rounded hover:bg-white transition-colors"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  )}
                  
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => handlePrimaryChange(index)}
                      className="p-2 bg-white/90 rounded hover:bg-white transition-colors"
                      aria-label="Set as primary"
                    >
                      <Check className="w-5 h-5 text-primary" />
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-2 bg-white/90 rounded hover:bg-red-50 text-red-500 transition-colors"
                    aria-label="Delete image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Alt text input */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={image.alt_text || ""}
                    onChange={(e) => {
                      setImages(prev => prev.map((img, i) => 
                        i === index ? { ...img, alt_text: e.target.value } : img
                      ));
                    }}
                    placeholder="Alt text (optional)"
                    className="input text-xs w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;