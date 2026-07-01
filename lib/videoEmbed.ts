/**
 * Turn a clip URL into an in-page embed so videos play on the site instead of
 * opening a new tab. Supports YouTube, Instagram, and TikTok; anything else
 * falls back to an external link.
 */
export interface EmbedInfo {
  kind: "youtube" | "instagram" | "tiktok" | "external";
  url: string;
  embedUrl?: string;
  thumbnail?: string;
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host.endsWith("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean); // shorts/ID, embed/ID
      if ((parts[0] === "shorts" || parts[0] === "embed") && parts[1]) return parts[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

function instagramEmbed(url: string): string | null {
  const m = url.match(/instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null;
}

function tiktokEmbed(url: string): string | null {
  const m = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
  return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
}

export function getEmbed(url: string): EmbedInfo {
  const yt = youtubeId(url);
  if (yt) {
    return {
      kind: "youtube",
      url,
      embedUrl: `https://www.youtube.com/embed/${yt}`,
      thumbnail: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
    };
  }
  const ig = instagramEmbed(url);
  if (ig) return { kind: "instagram", url, embedUrl: ig };

  const tt = tiktokEmbed(url);
  if (tt) return { kind: "tiktok", url, embedUrl: tt };

  return { kind: "external", url };
}

export function hasThumbnail(url: string): string | null {
  return getEmbed(url).thumbnail ?? null;
}
