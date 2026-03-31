import { WineDBItem } from '../types/Wine';
import { WineUserDTO } from '../api/wine';

/**
 * Ranks wine search results by relevance to the query.
 * Prioritizes: exact match > starts-with > word-boundary match > contains.
 */
export function rankByRelevance(items: WineDBItem[], query: string): WineDBItem[] {
  if (!query) return items;

  const q = query.toLowerCase().trim();

  const scored = items.map(item => {
    const nameEng = (item.nameEng || '').toLowerCase();
    const nameKor = (item.nameKor || '').toLowerCase();

    const score = Math.min(
      getRelevanceScore(nameEng, q),
      getRelevanceScore(nameKor, q),
    );

    return { item, score };
  });

  scored.sort((a, b) => a.score - b.score);

  return scored.map(s => s.item);
}

function getRelevanceScore(name: string, query: string): number {
  if (!name) return 100;

  // Exact match
  if (name === query) return 0;

  // Starts with query
  if (name.startsWith(query)) return 1;

  // A word in the name starts with the query
  const words = name.split(/[\s,\-().]+/);
  for (const word of words) {
    if (word.startsWith(query)) return 2;
  }

  // Name contains query as substring
  if (name.includes(query)) return 3;

  // Query words all appear in name (for multi-word queries)
  const queryWords = query.split(/\s+/);
  if (queryWords.length > 1 && queryWords.every(qw => name.includes(qw))) return 4;

  // Partial: any query word starts a word in the name
  for (const qw of queryWords) {
    for (const word of words) {
      if (word.startsWith(qw)) return 5;
    }
  }

  // No strong match - keep original order
  return 50;
}

/**
 * Same relevance ranking for WineUserDTO[] (used in TastingNoteWrite, WineAdd).
 */
export function rankWineUserDTOByRelevance(items: WineUserDTO[], query: string): WineUserDTO[] {
  if (!query) return items;

  const q = query.toLowerCase().trim();

  const scored = items.map(item => {
    const nameEng = (item.nameEng || '').toLowerCase();
    const nameKor = (item.name || '').toLowerCase();

    const score = Math.min(
      getRelevanceScore(nameEng, q),
      getRelevanceScore(nameKor, q),
    );

    return { item, score };
  });

  scored.sort((a, b) => a.score - b.score);

  return scored.map(s => s.item);
}
