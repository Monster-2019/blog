import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

export const GET: APIRoute = async () => {
  const logo = await readFile(join(process.cwd(), "public", "logo.jpg"));
  const pngBuffer = await sharp(logo).png().toBuffer();

  return new Response(new Uint8Array(pngBuffer), {
    headers: { "Content-Type": "image/png" },
  });
};
