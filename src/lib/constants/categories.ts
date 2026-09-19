export interface TaxonomyCategory {
  slug: string;
  name: string;
  group: string;
  aliases?: string[];
}

export const CANONICAL_CATEGORIES: TaxonomyCategory[] = [
  // Living Room
  { slug: 'sofa-armchair', name: 'Sofa & Armchair', group: 'Living Room', aliases: ['sofa', 'sofas', 'armchair', 'couch'] },
  { slug: 'coffee-side-table', name: 'Coffee & Side Table', group: 'Living Room', aliases: ['coffee table', 'side table'] },
  { slug: 'tv-cabinet', name: 'TV Cabinet', group: 'Living Room', aliases: ['tv stand', 'tv console', 'media unit'] },
  { slug: 'living-room', name: 'Living Room', group: 'Living Room', aliases: ['living'] },

  // Dining Room
  { slug: 'dining-table', name: 'Dining Table', group: 'Dining Room', aliases: ['dining table'] },
  { slug: 'dining-chair', name: 'Dining Chair', group: 'Dining Room', aliases: ['dining chair', 'dining chairs'] },
  { slug: 'counter-bar-table', name: 'Counter & Bar Table', group: 'Dining Room', aliases: ['counter table', 'bar table'] },
  { slug: 'sideboard-buffet', name: 'Sideboard & Buffet', group: 'Dining Room', aliases: ['sideboard', 'buffet'] },
  { slug: 'dining-room', name: 'Dining Room', group: 'Dining Room', aliases: ['dining'] },

  // Bedroom
  { slug: 'bed-frame', name: 'Bed Frame', group: 'Bedroom', aliases: ['bed', 'beds', 'queen bed', 'king bed'] },
  { slug: 'mattress', name: 'Mattress', group: 'Bedroom', aliases: ['mattresses'] },
  { slug: 'bedside-table', name: 'Bedside Table', group: 'Bedroom', aliases: ['nightstand'] },
  { slug: 'dresser-drawer', name: 'Dresser & Drawer', group: 'Bedroom', aliases: ['dresser', 'tall dresser', 'drawers'] },
  { slug: 'wardrobe', name: 'Wardrobe', group: 'Bedroom', aliases: ['closet', 'open wardrobe'] },
  { slug: 'bedroom', name: 'Bedroom', group: 'Bedroom' },

  // Storage & Office
  { slug: 'bookcase-display', name: 'Bookcase & Display', group: 'Storage & Office', aliases: ['bookcase', 'shelf', 'shelving'] },
  { slug: 'shoe-cabinet', name: 'Shoe Cabinet', group: 'Storage & Office', aliases: ['shoe storage'] },
  { slug: 'desk-office', name: 'Desk & Office', group: 'Storage & Office', aliases: ['desk', 'office chair', 'study desk'] },
];

export const POPULAR_CATEGORY_SUGGESTIONS = [
  'Sofa & Armchair',
  'Living Room',
  'Dining Table',
  'Dining Chair',
  'Dining Room',
  'Bed Frame',
  'Mattress',
  'Bedroom',
  'TV Cabinet',
  'Sideboard & Buffet',
  'Coffee & Side Table',
  'Shoe Cabinet',
  'Bookcase & Display',
];
