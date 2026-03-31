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

  const words = name.split(/[\s,\-().]+/).filter(Boolean);

  // Exact full match
  if (name === query) return 0;

  // Name starts with query AND query matches a complete word
  // e.g. "dom perignon" starts with "dom" and "dom" is a full word
  if (name.startsWith(query) && words[0] === query) return 1;

  // A word in the name exactly equals the query
  // e.g. searching "dom" matches "Ch. dom ..." where "dom" is a standalone word
  if (words.includes(query)) return 2;

  // Name starts with query (prefix only, not a full word)
  // e.g. "domaene" starts with "dom" but "dom" isn't a complete word
  if (name.startsWith(query)) return 3;

  // A word in the name starts with the query (prefix of a word)
  for (const word of words) {
    if (word === query) return 2;
    if (word.startsWith(query)) return 4;
  }

  // Name contains query as substring
  if (name.includes(query)) return 5;

  // Query words all appear in name (for multi-word queries)
  const queryWords = query.split(/\s+/);
  if (queryWords.length > 1 && queryWords.every(qw => name.includes(qw))) return 6;

  // Partial: any query word starts a word in the name
  for (const qw of queryWords) {
    for (const word of words) {
      if (word.startsWith(qw)) return 7;
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
