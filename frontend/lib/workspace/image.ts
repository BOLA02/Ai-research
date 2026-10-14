const LONG_EDGE = 2000;
const SMALL_ENOUGH = 1.5 * 1024 * 1024;

const decode = (file: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("We couldn't read that image. Try a PNG or JPEG."));
    };
    image.src = url;
  });

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Gets a picture ready to upload. Phone photos are often 5 MB or more, so large
 * pictures are scaled down to a size that still prints sharply in a report.
 * Anything the browser can show (PNG, JPEG, WebP, HEIC on Apple devices) is accepted.
 */
export async function prepareImage(file: File, maxBytes: number): Promise<File> {
  const plain = file.type === "image/png" || file.type === "image/jpeg";
  const image = await decode(file);
  const { naturalWidth: width, naturalHeight: height } = image;
  if (plain && file.size <= SMALL_ENOUGH && Math.max(width, height) <= LONG_EDGE) return file;

  const scale = Math.min(1, LONG_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser can't resize images. Use a smaller PNG or JPEG.");

  // A diagram keeps its sharp edges as PNG when it fits; photos become JPEG.
  if (file.type === "image/png") {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await toBlob(canvas, "image/png");
    if (png && png.size <= maxBytes) return new File([png], file.name.replace(/\.\w+$/, "") + ".png", { type: "image/png" });
  }
  context.fillStyle = "#ffffff"; // JPEG has no transparency
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.88, 0.75, 0.6]) {
    const jpeg = await toBlob(canvas, "image/jpeg", quality);
    if (jpeg && jpeg.size <= maxBytes) return new File([jpeg], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  }
  throw new Error("That image is still too large after shrinking it. Try a smaller one.");
}
