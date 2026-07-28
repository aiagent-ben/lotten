export const collectionsMap: Record<string, string> = {
  'col-breda': 'Breda',
  'col-dover': 'Dover',
  'col-malton': 'Malton',
  'col-lamar': 'Lamar',
  'col-kyoto': 'Kyoto',
  'col-dudley': 'Dudley',
  'col-ludlow': 'Ludlow',
  'col-loftus': 'Loftus',
  'col-hutto': 'Hutto',
  'col-royston': 'Royston',
  'col-oruro': 'Oruro',
  'col-waldo': 'Waldo',
  'col-castor': 'Castor',
  'col-hayton': 'Hayton',
  'col-neath': 'Neath',
  'col-hampton': 'Hampton',
  'col-noud': 'Noud',
  'col-nakula': 'Nakula',
};

export function getCollectionName(collectionId: string): string {
  return collectionsMap[collectionId] || 'Collection';
}