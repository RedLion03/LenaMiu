// Server-and-client safe. Strict YouTube videoId extraction — used to keep
// videos.src for src_type='youtube' to exactly an 11-char id (the only shape
// we trust), defending against XSS via crafted URLs (see prior security audit
// item #4).

const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

const ACCEPTED_HOSTS = new Set([
  "youtu.be",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

/**
 * Returns a clean 11-char videoId, or null if the input cannot be parsed.
 * Accepts a bare id, a /watch?v=, a /embed/, /shorts/, /live/, or a youtu.be link.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (ID_RE.test(trimmed)) return trimmed;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  if (!ACCEPTED_HOSTS.has(u.hostname.toLowerCase())) return null;

  if (u.hostname.toLowerCase() === "youtu.be") {
    const id = u.pathname.slice(1);
    return ID_RE.test(id) ? id : null;
  }

  const v = u.searchParams.get("v");
  if (v && ID_RE.test(v)) return v;

  const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
