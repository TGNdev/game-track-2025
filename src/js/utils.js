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