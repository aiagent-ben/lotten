'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

interface HotspotMarkerProps {
  label: string;
  tooltip: string;
  productId: string;
  x: number;
  y: number;
}

export function HotspotMarker({ label, tooltip, productId, x, y }: HotspotMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="absolute pointer-events-auto"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label={tooltip || label}
      >
        <ShoppingBag className="w-5 h-5 text-primary-600" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-600 rounded-full border-2 border-white" />
      </button>
      
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
          {tooltip || label}
          <Link 
            href={`/products/${productId}`}
            className="block mt-1 text-primary-300 hover:text-primary-200 underline text-center"
          >
            View Product
          </Link>
        </div>
      )}
    </div>
  );
}

interface HotspotsOverlayProps {
  hotspots: Array<{ productId: string; x: number; y: number; label: string; tooltip: string }>;
}

export function HotspotsOverlay({ hotspots }: HotspotsOverlayProps) {
  if (hotspots.length === 0) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {hotspots.map((hotspot, index) => (
        <HotspotMarker 
          key={index}
          {...hotspot}
        />
      ))}
    </div>
  );
}