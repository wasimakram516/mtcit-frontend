export function normalizeMapEmbedUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (!host.includes("google.")) {
      return value;
    }

    if (path.includes("/maps/embed")) {
      return parsed.toString();
    }

    if (path.includes("/maps/d/embed")) {
      return parsed.toString();
    }

    const mapId = parsed.searchParams.get("mid");
    if (!mapId) {
      return value;
    }

    if (path.includes("/maps/d/")) {
      const embedUrl = new URL("https://www.google.com/maps/d/embed");
      embedUrl.searchParams.set("mid", mapId);

      const ehbc = parsed.searchParams.get("ehbc");
      if (ehbc) {
        embedUrl.searchParams.set("ehbc", ehbc);
      }

      return embedUrl.toString();
    }

    return value;
  } catch {
    return value;
  }
}
