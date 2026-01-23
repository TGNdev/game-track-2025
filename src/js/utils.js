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
        className="bg-white/20 text-black rounded"
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
  if (!search || search.length < 2) return true;

  const q = search.toLowerCase();
  const searchTerms = q.split(/\s+/).filter((t) => t.length > 0);

  if (searchTerms.length === 0) return true;

  const targetLower = target.toLowerCase();
  // Split target by space, dash, or colon to get words
  const targetWords = targetLower.split(/[\s-:]+/).filter((t) => t.length > 0);
  const targetAcronym = targetWords.map((w) => w[0]).join("");

  return searchTerms.every((term) => {
    // 1. Substring match
    if (targetLower.includes(term)) return true;

    // 2. Acronym match (the term is part of the acronym)
    if (targetAcronym.includes(term)) return true;

    // 3. Any word in target starts with this term
    if (targetWords.some((word) => word.startsWith(term))) return true;

    return false;
  });
};
