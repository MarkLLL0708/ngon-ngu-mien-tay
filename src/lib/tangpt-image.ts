// Chuẩn bị ảnh phía client: kiểm tra định dạng, giới hạn 8 MB, thu nhỏ còn tối đa 1568px cạnh dài.
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_SIDE = 1568;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type PreparedImage = { dataUrl: string; mediaType: string };

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_decode_failed"));
    image.src = url;
  });
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error("bad_image_type");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("image_too_large");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const longest = Math.max(image.naturalWidth, image.naturalHeight) || 1;
    const scale = Math.min(1, MAX_IMAGE_SIDE / longest);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas_unavailable");
    ctx.drawImage(image, 0, 0, width, height);
    const mediaType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const dataUrl = canvas.toDataURL(mediaType, 0.85);
    return { dataUrl, mediaType };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function imageErrorText(error: unknown, vi: boolean) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("bad_image_type")) return vi ? "Chỉ nhận ảnh JPG, PNG hoặc WebP nha." : "Only JPG, PNG or WebP images are supported.";
  if (message.includes("image_too_large")) return vi ? "Ảnh lớn quá 8 MB, chọn ảnh nhẹ hơn nha." : "The image is over 8 MB, please pick a smaller one.";
  return vi ? "Không đọc được ảnh này, thử ảnh khác nha." : "Could not read this image, try another one.";
}
