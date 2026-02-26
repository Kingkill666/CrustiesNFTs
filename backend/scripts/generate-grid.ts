/**
 * Generate 9 Crustie variations for the homepage grid
 * using Replicate's SDXL img2img with the base Crustie as reference.
 *
 * Usage: npx tsx scripts/generate-grid.ts
 */

import Replicate from "replicate";
import { writeFile, readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env manually
const envPath = resolve(__dirname, "../../.env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}


const GRID_DIR = resolve(__dirname, "../../frontend/public/images/grid");
const BASE_IMAGE_PATH = resolve(
  __dirname,
  "../../public/images/IMG_3692.jpeg"
);

const VARIATIONS = [
  {
    name: "pepperoni-punk",
    prompt:
      "A spooky melting pizza slice character with red glowing eyes, dripping cheese arms, pepperoni toppings scattered on face, punk rock style with mohawk made of pepperoni, dark background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
  {
    name: "mushroom-mystic",
    prompt:
      "A spooky melting pizza slice character with red glowing eyes, dripping cheese arms, covered in magical mushroom toppings, mystical purple aura, wizard hat, dark background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
  {
    name: "pineapple-pirate",
    prompt:
      "A spooky melting pizza slice character with red glowing eyes, dripping cheese arms, pineapple chunks as toppings, pirate eyepatch, tropical vibes, dark background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
  {
    name: "basil-beast",
    prompt:
      "A spooky melting pizza slice character with green glowing eyes, dripping cheese arms, fresh basil leaves as toppings, wild monster expression, dark background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
  {
    name: "hot-sauce-demon",
    prompt:
      "A spooky melting pizza slice character with fiery red glowing eyes, dripping cheese arms, jalapeño and hot pepper toppings, flames around it, demon horns, dark background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
  {
    name: "cheese-phantom",
    prompt:
      "A spooky melting pizza slice character with ghostly white glowing eyes, extra dripping cheese everywhere, ghost-like floating, ethereal glow, dark background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
  {
    name: "olive-alien",
    prompt:
      "A spooky melting pizza slice character with green glowing eyes, dripping cheese arms, black olive toppings as alien spots, alien antennae, space background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
  {
    name: "truffle-royal",
    prompt:
      "A spooky melting pizza slice character with golden glowing eyes, dripping cheese arms, truffle and gold flake toppings, wearing a crown, royal cape, dark background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
  {
    name: "bbq-bandit",
    prompt:
      "A spooky melting pizza slice character with red glowing eyes, dripping cheese arms, bbq chicken toppings, cowboy hat, western bandit bandana, dark background, cartoon illustration, bold outlines, vibrant colors, NFT PFP avatar style",
  },
];

async function main() {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    console.error("REPLICATE_API_KEY not set in .env");
    process.exit(1);
  }

  const replicate = new Replicate({ auth: apiKey });

  // Read base image and convert to data URI for img2img
  const imageBuffer = await readFile(BASE_IMAGE_PATH);
  const base64 = imageBuffer.toString("base64");
  const dataUri = `data:image/jpeg;base64,${base64}`;

  console.log(`Generating ${VARIATIONS.length} Crustie variations...`);
  console.log(`Output: ${GRID_DIR}\n`);

  for (let i = 0; i < VARIATIONS.length; i++) {
    const variation = VARIATIONS[i];
    console.log(
      `[${i + 1}/${VARIATIONS.length}] Generating ${variation.name}...`
    );

    try {
      const output = await replicate.run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        {
          input: {
            image: dataUri,
            prompt: variation.prompt,
            negative_prompt:
              "blurry, low quality, text, watermark, realistic, photograph, 3d render, human, person",
            prompt_strength: 0.75,
            width: 1024,
            height: 1024,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 30,
          },
        }
      );

      const imageUrls = output as string[];
      const imageUrl = imageUrls[0];

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const filePath = resolve(GRID_DIR, `${variation.name}.png`);
      await writeFile(filePath, Buffer.from(arrayBuffer));

      console.log(`  ✓ Saved ${variation.name}.png`);
    } catch (error) {
      console.error(
        `  ✗ Failed: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  console.log("\nDone! Grid images saved to frontend/public/images/grid/");
}

main();
