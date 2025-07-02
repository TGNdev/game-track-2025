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