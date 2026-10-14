// Absolute URLs (http/https), inline data and local previews (blob:) are used
// as-is; anything else is a path stored by the API under its uploads folder.
const ABSOLUTE_URL = /^(https?:|data:|blob:)/i;

function resolveMediaUrl(src) {
  if (!src) return src;
  return ABSOLUTE_URL.test(src) ? src : `${import.meta.env.VITE_BASE_URL}/${src}`;
}

export default resolveMediaUrl;
