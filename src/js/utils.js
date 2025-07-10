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
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-yellow-200 font-semibold rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
}

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
