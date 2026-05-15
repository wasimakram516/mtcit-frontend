/** Normalize DisplayMedia.layers or Background API docs into a slideshow slide list. */

export function pickSlideSource(slide, language = "en") {
  if (!slide) return { src: null, type: "image" };
  const isAr = language === "ar";

  if (slide.fileEn || slide.fileAr) {
    const pref = isAr ? slide.fileAr : slide.fileEn;
    const fallback = isAr ? slide.fileEn : slide.fileAr;
    const prefUrl = pref?.url;
    const fallbackUrl = fallback?.url;
    if (prefUrl) {
      return { src: prefUrl, type: pref?.type || slide.typeEn || slide.typeAr || "image" };
    }
    if (fallbackUrl) {
      return { src: fallbackUrl, type: fallback?.type || slide.typeEn || slide.typeAr || "image" };
    }
    return { src: null, type: "image" };
  }

  const src = isAr
    ? slide.imageUrlAr || slide.imageUrlEn || slide.imageUrl
    : slide.imageUrlEn || slide.imageUrlAr || slide.imageUrl;
  const type = isAr ? slide.typeAr || slide.typeEn || "image" : slide.typeEn || slide.typeAr || "image";
  return { src: src || null, type };
}

export function normalizeSlidesForPlayback(rawSlides = []) {
  return [...rawSlides]
    .filter((s) => s && s.isActive !== false)
    .sort((a, b) => {
      const seqA = a.sequence ?? a.layer ?? 0;
      const seqB = b.sequence ?? b.layer ?? 0;
      return seqA - seqB;
    })
    .map((slide, index) => ({
      ...slide,
      sequence: slide.sequence ?? slide.layer ?? index,
      opacity: slide.opacity ?? 1,
      darkOverlay: slide.darkOverlay ?? 0,
      lightOverlay: slide.lightOverlay ?? 0,
      displayTitle: slide.displayTitle ?? slide.title ?? "",
      titleFontSize: Number(slide.titleFontSize ?? 100),
      titlePosition: slide.titlePosition || { x: 50, y: 50 },
    }));
}

/** Resolve persisted URLs from form slide state (handles API subdocs + previews). */
export function resolveSlideExistingUrls(slide = {}) {
  const urlFromFile = (f) =>
    f && typeof f === "object" && !(f instanceof File) ? f.url || "" : "";
  const previewUrl = (p) => (p && !String(p).startsWith("blob:") ? String(p) : "");
  return {
    existingUrlEn:
      slide.existingUrlEn || urlFromFile(slide.fileEn) || previewUrl(slide.previewEn) || "",
    existingUrlAr:
      slide.existingUrlAr || urlFromFile(slide.fileAr) || previewUrl(slide.previewAr) || "",
  };
}

export function slideHasPersistableMedia(slide = {}) {
  const urls = resolveSlideExistingUrls(slide);
  return Boolean(
    (slide.fileEn instanceof File) ||
      (slide.fileAr instanceof File) ||
      urls.existingUrlEn ||
      urls.existingUrlAr
  );
}

/** Serialize CMS form slides for DisplayMedia `layers` API payload. */
export function serializeBackgroundSlidesForApi(slideList = []) {
  const filesEn = [];
  const filesAr = [];
  const meta = slideList.filter(slideHasPersistableMedia).map((slide, index) => {
    const urls = resolveSlideExistingUrls(slide);
    const isFileEn = slide.fileEn instanceof File;
    const isFileAr = slide.fileAr instanceof File;
    const fileIndexEn = isFileEn ? filesEn.length : null;
    if (isFileEn) filesEn.push(slide.fileEn);
    const fileIndexAr = isFileAr ? filesAr.length : null;
    if (isFileAr) filesAr.push(slide.fileAr);
    return {
      fileIndexEn,
      fileIndexAr,
      existingUrlEn: urls.existingUrlEn,
      existingUrlAr: urls.existingUrlAr,
      typeEn: slide.typeEn || "image",
      typeAr: slide.typeAr || "image",
      opacity: slide.opacity ?? 1,
      darkOverlay: slide.darkOverlay ?? 0,
      lightOverlay: slide.lightOverlay ?? 0,
      displayTitle: String(slide.displayTitle ?? "").trim(),
      titleFontSize: Number(slide.titleFontSize ?? 100),
      titlePosition: {
        x: Number(slide.titlePosition?.x ?? 50),
        y: Number(slide.titlePosition?.y ?? 50),
      },
      isActive: slide.isActive !== undefined ? slide.isActive : true,
      sequence: index,
    };
  });
  return { meta, filesEn, filesAr };
}

export const createEmptyBackgroundSlide = (slide = {}) => {
  const legacyFile = slide.file && typeof slide.file === "object" ? slide.file : null;
  const fileEn = slide.fileEn || (legacyFile?.url ? { type: legacyFile.type || "image", url: legacyFile.url } : null);
  const fileAr = slide.fileAr || null;

  return {
    _id: slide._id || slide.id || undefined,
    layer: slide.layer ?? slide.sequence,
    fileEn,
    fileAr,
    existingUrlEn: fileEn?.url || slide.existingUrlEn || slide.imageUrlEn || legacyFile?.url || "",
    existingUrlAr: fileAr?.url || slide.existingUrlAr || slide.imageUrlAr || "",
    previewEn: fileEn?.url || slide.previewEn || slide.existingUrlEn || slide.imageUrlEn || legacyFile?.url || "",
    previewAr: fileAr?.url || slide.previewAr || slide.existingUrlAr || slide.imageUrlAr || "",
    typeEn: fileEn?.type || slide.typeEn || "image",
    typeAr: fileAr?.type || slide.typeAr || "image",
    opacity: slide.opacity ?? 1,
    darkOverlay: slide.darkOverlay ?? 0,
    lightOverlay: slide.lightOverlay ?? 0,
    displayTitle: slide.displayTitle ?? slide.title ?? "",
    titleFontSize: Number(slide.titleFontSize ?? 100),
    titlePosition: slide.titlePosition || { x: 50, y: 50 },
    isActive: slide.isActive !== undefined ? slide.isActive : true,
    removeEn: false,
    removeAr: false,
  };
};
