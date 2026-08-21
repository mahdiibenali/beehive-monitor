/**
 * Avatar / profile-picture utilities.
 *
 * We store user avatars as inline data URIs in MongoDB (`User.avatarSrc`).
 * For that to remain cheap, the picture is downsized client-side to a
 * 256×256 JPEG before upload.
 */

export const AVATAR_MAX_PX = 256;
export const AVATAR_QUALITY = 0.85;
/** Maximum allowed size for the base64 payload (≈ 220 KB encoded). */
export const AVATAR_MAX_BYTES = 220 * 1024;

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export class AvatarError extends Error {}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new AvatarError("Image illisible."));
    img.src = src;
  });
}

/**
 * Resize + cover-crop a user-picked file to a square JPEG data URI.
 * Throws `AvatarError` on invalid input or output too large.
 */
export async function fileToAvatarDataUrl(
  file: File,
  options?: { size?: number; quality?: number }
): Promise<string> {
  if (!file.type || !ACCEPTED_MIME.includes(file.type)) {
    throw new AvatarError(
      "Format non supporté. Utilisez JPG, PNG, WEBP ou GIF."
    );
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new AvatarError("Image trop volumineuse (max 8 Mo).");
  }

  const size = options?.size ?? AVATAR_MAX_PX;
  const quality = options?.quality ?? AVATAR_QUALITY;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new AvatarError("Canvas non supporté par ce navigateur.");

    // Cover-crop centered.
    const scale = Math.max(size / img.width, size / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const dx = (size - drawW) / 2;
    const dy = (size - drawH) / 2;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, dx, dy, drawW, drawH);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const bytes = approxDataUrlBytes(dataUrl);
    if (bytes > AVATAR_MAX_BYTES) {
      // Retry once at a lower quality before giving up.
      const fallback = canvas.toDataURL("image/jpeg", Math.max(0.6, quality - 0.2));
      if (approxDataUrlBytes(fallback) > AVATAR_MAX_BYTES) {
        throw new AvatarError(
          "Image trop lourde après compression. Réessayez avec une autre photo."
        );
      }
      return fallback;
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function approxDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4);
}

/**
 * Server-safe validation. Accepts:
 *   • Empty string         → clears the avatar
 *   • `/foo/bar.svg`       → static asset from `public/`
 *   • `data:image/...`     → inline data URI under AVATAR_MAX_BYTES
 *   • `https://…`          → external URL (CDN, etc.)
 */
export function isValidAvatarSrc(src: unknown): src is string {
  if (typeof src !== "string") return false;
  if (src === "") return true;
  if (src.startsWith("/")) return src.length < 256;
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src.length < 512;
  }
  if (src.startsWith("data:image/")) {
    if (!/^data:image\/(jpeg|png|webp|gif);base64,/.test(src)) return false;
    return approxDataUrlBytes(src) <= AVATAR_MAX_BYTES;
  }
  return false;
}
