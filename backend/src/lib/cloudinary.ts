import { createHash } from "node:crypto";
import { env } from "../config/env";

export const cloudinaryEnabled = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

/** Cloudinary signs a request with the sorted parameters followed by the API secret. */
export function sign(params: Record<string, string | number>, secret: string) {
  const text = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(text + secret).digest("hex");
}

async function call(path: "image/upload" | "image/destroy", params: Record<string, string | number>, file?: string) {
  const secret = env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { ...params, timestamp };
  const form = new FormData();
  for (const [key, value] of Object.entries(signed)) form.append(key, String(value));
  form.append("api_key", env.CLOUDINARY_API_KEY!);
  form.append("signature", sign(signed, secret));
  if (file) form.append("file", file);
  const response = await fetch(`${process.env.CLOUDINARY_API_BASE || "https://api.cloudinary.com"}/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${path}`, { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
  const body = (await response.json().catch(() => null)) as { secure_url?: string; public_id?: string; result?: string; error?: { message?: string } } | null;
  if (!response.ok) throw new Error(`Cloudinary: ${body?.error?.message ?? response.status}`);
  return body ?? {};
}

export async function uploadImage(bytes: Buffer, mimeType: string, folder: string) {
  const body = await call("image/upload", { folder }, `data:${mimeType};base64,${bytes.toString("base64")}`);
  if (!body.secure_url || !body.public_id) throw new Error("Cloudinary did not return an address for the image");
  return { url: body.secure_url, publicId: body.public_id };
}

/** Best effort: a picture left behind on Cloudinary is harmless, so a failure is only logged. */
export async function destroyImage(publicId: string) {
  try {
    await call("image/destroy", { public_id: publicId, invalidate: "true" });
  } catch (error) {
    console.error("Could not delete an image on Cloudinary", error instanceof Error ? error.message : error);
  }
}

export async function download(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Could not fetch the image (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}
