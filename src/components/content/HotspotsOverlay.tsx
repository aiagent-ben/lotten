'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
  };

  const isVisible = isHovered || isOpen;
  const isNearTop = y < 25;
  const horizontalAlign = x > 75 
    ? 'right-0' 
    : x < 25 
    ? 'left-0' 
    : 'left-1/2 -translate-x-1/2';

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-auto"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isVisible ? 30 : 10,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="w-10 h-10 rounded-full bg-white/95 text-stone-900 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-stone-200/60 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
        aria-label={tooltip || label}
        aria-expanded={isVisible}
      >
        <ShoppingBag className="w-5 h-5 text-amber-800" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-700 rounded-full border-2 border-white" />
      </button>
      
      {isVisible && (
        <div 
          className={`absolute ${
            isNearTop ? 'top-full pt-2' : 'bottom-full pb-2'
          } ${horizontalAlign} z-30 pointer-events-auto`}
        >
          <div className="min-w-48 max-w-xs px-3.5 py-2.5 bg-stone-900/95 text-stone-100 text-xs rounded-xl shadow-xl whitespace-nowrap backdrop-blur-sm border border-stone-800/80">
            <p className="font-medium text-stone-200 mb-1 leading-snug">{tooltip || label}</p>
            <Link 
              href={`/products/${productId}`}
              className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-medium underline"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Shop Piece</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
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