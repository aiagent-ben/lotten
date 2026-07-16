import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatCurrency(amount: number, currency = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-MY').format(num);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `ORD-${year}-${random}`;
}

export function parseDimensions(dimensions: string): { width: number | null; depth: number | null; height: number | null } {
  const match = dimensions.match(/Dimension \(mm\):\s*W(\d+)\s*D(\d+)\s*H(\d+)/);
  if (match) {
    return { width: parseInt(match[1]), depth: parseInt(match[2]), height: parseInt(match[3]) };
  }
  return { width: null, depth: null, height: null };
}

export function parseWeight(weight: string): number | null {
  const match = weight.match(/Gross Weight \(kg\):\s*([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

export function parseVolume(volume: string): number | null {
  const match = volume.match(/m³:\s*([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

export function parsePackType(pack: string): string | null {
  const match = pack.match(/Pack Type:\s*([^\n]+)/);
  return match ? match[1].trim() : null;
}

export function parseCartonDimensions(carton: string): { length: number | null; width: number | null; height: number | null } {
  const match = carton.match(/L(\d+)\s*W(\d+)\s*H(\d+)/);
  if (match) {
    return { length: parseInt(match[1]), width: parseInt(match[2]), height: parseInt(match[3]) };
  }
  return { length: null, width: null, height: null };
}

export function getColorHex(code: string): string {
  // Color code to hex mapping
  const colorMap: Record<string, string> = {
    '109': '#4A3728', // Cocoa
    '167': '#E8E0D8', // White Marble
    '113': '#3D2B1F', // Walnut
    '114': '#1A1A1A', // Black
    '102': '#8B7355', // Natural
    '111': '#F5F0E8', // White Wash
    '1325': '#2A3B4D', // Space Blue
    '112': '#B8A898', // Oak
    '107': '#3D2B1F', // Dark Walnut
    '130': '#F8F8F8', // White Lacquer
    '1318': '#3D2B1F', // Gunmetal Grey
    '173': '#2D2520', // Dark
    '1001': '#8B7355', // Natural
    '802': '#C5A050', // Gold
    '185': '#6B6B6B', // Grey Marble
    '166': '#4A3728', // Cocoa
    '179': '#2D2520', // Wotan Oak
    '808': '#C5A050', // Gold
    '211': '#8B7355', // Natural
    '3790': '#9CA3AF', // Light Grey
    '3791': '#F5F0E8', // Cream White
  };
  return colorMap[code] || '#CCCCCC';
}

export function getStockStatus(available: number, threshold: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (available <= 0) return 'out_of_stock';
  if (available <= threshold) return 'low_stock';
  return 'in_stock';
}

export function getStockBadgeClass(status: string): string {
  switch (status) {
    case 'in_stock':
      return 'badge-success';
    case 'low_stock':
      return 'badge-warning';
    case 'out_of_stock':
      return 'badge-destructive';
    default:
      return 'badge-gray';
  }
}

export function getStockBadgeText(status: string): string {
  switch (status) {
    case 'in_stock':
      return 'In Stock';
    case 'low_stock':
      return 'Low Stock';
    case 'out_of_stock':
      return 'Out of Stock';
    default:
      return 'Unknown';
  }
}