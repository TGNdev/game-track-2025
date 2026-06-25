import he from "he";

export const slugify = (str) =>
  str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();

export const deslugify = (slug) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())

export const highlightMatch = (text, query) => {
  if (!query || query.length < 2) return text;

  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
  if (terms.length === 0) return text;

  const textLower = text.toLowerCase();
  const highlightIndices = [];

  terms.forEach((term) => {
    let startIdx = 0;
    while ((startIdx = textLower.indexOf(term, startIdx)) !== -1) {
      highlightIndices.push({ start: startIdx, end: startIdx + term.length });
      startIdx += 1;
    }
  });

  const words = text.split(/[\s-:]+/).filter((w) => w.length > 0);
  const targetWordsWithIndices = [];
  let pos = 0;
  words.forEach((word) => {
    const wordStart = textLower.indexOf(word.toLowerCase(), pos);
    if (wordStart !== -1) {
      targetWordsWithIndices.push({ word, start: wordStart });
      pos = wordStart + word.length;
    }
  });

  const targetAcronym = targetWordsWithIndices
    .map((w) => w.word[0].toLowerCase())
    .join("");

  terms.forEach((term) => {
    let aIdx = 0;
    while ((aIdx = targetAcronym.indexOf(term, aIdx)) !== -1) {
      for (let k = 0; k < term.length; k++) {
        const wordRef = targetWordsWithIndices[aIdx + k];
        highlightIndices.push({ start: wordRef.start, end: wordRef.start + 1 });
      }
      aIdx += 1;
    }
  });

  if (highlightIndices.length === 0) return text;

  highlightIndices.sort((a, b) => a.start - b.start);
  const mergedSpecs = [];
  let current = { ...highlightIndices[0] };
  for (let i = 1; i < highlightIndices.length; i++) {
    if (highlightIndices[i].start <= current.end) {
      current.end = Math.max(current.end, highlightIndices[i].end);
    } else {
      mergedSpecs.push(current);
      current = { ...highlightIndices[i] };
    }
  }
  mergedSpecs.push(current);

  const result = [];
  let lastIdx = 0;
  mergedSpecs.forEach((spec, i) => {
    if (spec.start > lastIdx) {
      result.push(text.substring(lastIdx, spec.start));
    }
    result.push(
      <span
        key={i}
        className="bg-amber-300 text-black rounded"
      >
        {text.substring(spec.start, spec.end)}
      </span>
    );
    lastIdx = spec.end;
  });
  if (lastIdx < text.length) {
    result.push(text.substring(lastIdx));
  }

  return result;
};

export const getPaginationRange = (length, itemsPerPage, currentPage) => {
  const totalPages = Math.ceil(length / itemsPerPage);
  const delta = 1;
  const range = [];
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  range.push(1);

  if (left > 2) {
    range.push('...');
  }

  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  if (right < totalPages - 1) {
    range.push('...');
  }

  if (totalPages > 1) {
    range.push(totalPages);
  }

  return range;
}


export const matchesSearch = (target, search) => {
  if (!search) return true;
  if (!target) return false;

  const q = search.toLowerCase().trim();
  if (q.length === 0) return true;

  const searchTerms = q.split(/\s+/).filter((t) => t.length > 0);
  if (searchTerms.length === 0) return true;

  // Decode entities and normalize accents
  const normalize = (str) =>
    he.decode(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const targetLower = normalize(target);
  const targetWords = targetLower.split(/[\s-:.]+/).filter((t) => t.length > 0);
  const targetAcronym = targetWords.map((w) => w[0]).join("");

  return searchTerms.every((term) => {
    const normalizedTerm = normalize(term);

    // 1. Substring match
    if (targetLower.includes(normalizedTerm)) return true;

    // 2. Acronym match
    if (targetAcronym.includes(normalizedTerm)) return true;

    // 3. Any word in target starts with this term
    if (targetWords.some((word) => word.startsWith(normalizedTerm))) return true;

    return false;
  });
};

export const getGameAliases = (gameName) => {
  const aliases = [gameName];

  // Normalize Roman numerals to Arabic numerals and vice versa
  const romanToArabic = { 'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10 };
  const arabicToRoman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };

  const words = gameName.split(/\s+/);
  if (words.length > 0) {
    const lastWord = words[words.length - 1];
    const lastWordLower = lastWord.toLowerCase();

    if (romanToArabic[lastWordLower]) {
      const arabic = romanToArabic[lastWordLower];
      const newName = [...words.slice(0, -1), arabic.toString()].join(" ");
      aliases.push(newName);
    } else if (/^\d+$/.test(lastWord)) {
      const arabic = parseInt(lastWord);
      if (arabicToRoman[arabic]) {
        const roman = arabicToRoman[arabic];
        const newName = [...words.slice(0, -1), roman].join(" ");
        aliases.push(newName);
      }
    }

    // Programmatic acronym generation (only for 3 or more capitalized non-roman, non-digit words)
    const isRoman = (w) => /^[IVXLCDM]+$/i.test(w);
    const isDigit = (w) => /^\d+$/.test(w);
    const capWords = words.filter(w => /^[A-Z]/.test(w) && !isRoman(w) && !isDigit(w));

    if (capWords.length >= 3) {
      const acronym = capWords.map(w => w[0]).join("");
      aliases.push(acronym);

      if (romanToArabic[lastWordLower] || /^\d+$/.test(lastWord)) {
        aliases.push(`${acronym} ${lastWord}`);
        aliases.push(`${acronym}${lastWord}`);

        if (romanToArabic[lastWordLower]) {
          const arabic = romanToArabic[lastWordLower];
          aliases.push(`${acronym} ${arabic}`);
          aliases.push(`${acronym}${arabic}`);
        } else if (/^\d+$/.test(lastWord)) {
          const arabic = parseInt(lastWord);
          const roman = arabicToRoman[arabic];
          if (roman) {
            aliases.push(`${acronym} ${roman}`);
            aliases.push(`${acronym}${roman}`);
          }
        }
      }
    }
  }

  return Array.from(new Set(aliases.filter(Boolean)));
};

export const isGameRelatedToNews = (game, title, summary) => {
  if (!game) return false;

  const gameName = game.name ? he.decode(game.name) : "";
  if (!gameName) return false;

  const aliases = getGameAliases(gameName);

  return aliases.some(alias => {
    const escaped = alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Case-sensitivity rule:
    // Match case-sensitively if the alias is short (length <= 10) OR if it is a single word (no spaces).
    // This successfully avoids false positives for single common words (inside, control)
    // or short common phrases (if found).
    const isCaseSensitive = alias.length <= 10 || !/\s/.test(alias);
    const flags = isCaseSensitive ? "" : "i";

    const regex = new RegExp('(?<![a-zA-Z0-9])' + escaped + '(?![a-zA-Z0-9])', flags);

    // 1. If the game is mentioned in the Title, it is a primary subject!
    if (title && regex.test(title)) {
      return true;
    }

    // 2. If it's not in the title, it must be mentioned at least 2 times in the summary to be a primary subject.
    if (summary) {
      const globalRegex = new RegExp('(?<![a-zA-Z0-9])' + escaped + '(?![a-zA-Z0-9])', flags + "g");
      const matches = summary.match(globalRegex);
      if (matches && matches.length >= 2) {
        return true;
      }
    }

    return false;
  });
};
