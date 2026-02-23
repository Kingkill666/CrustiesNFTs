import Replicate from "replicate";
import type { CrustiesTraits } from "./personality.js";

function buildPrompt(traits: CrustiesTraits): string {
  const traitDescriptions = [
    `${traits.crust.replace("_", " ")} crust pizza`,
    `${traits.cheese.replace("_", " ")} cheese`,
    `${traits.topping.replace("_", " ")} topping`,
    `${traits.sauce.replace("_", " ")} sauce`,
    `${traits.eyes.replace("_", " ")} eyes`,
    `${traits.nose.replace("_", " ")} nose`,
    `${traits.background.replace("_", " ")} background`,
    traits.accessory !== "none"
      ? `wearing ${traits.accessory.replace("_", " ")}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  return `A cute cartoon pizza character PFP avatar with ${traitDescriptions}. The pizza has a face with expressive features. Digital art style, clean lines, vibrant colors, suitable for a profile picture. No text. Square format.`;
}

export async function generateImage(traits: CrustiesTraits): Promise<Buffer> {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    throw new Error("REPLICATE_API_KEY is not set");
  }

  const replicate = new Replicate({ auth: apiKey });
  const prompt = buildPrompt(traits);

  const output = await replicate.run("stability-ai/sdxl:latest", {
    input: {
      prompt,
      negative_prompt:
        "blurry, low quality, text, watermark, realistic, photograph",
      width: 1024,
      height: 1024,
      num_outputs: 1,
    },
  });

  // Replicate returns an array of URLs
  const imageUrls = output as string[];
  const imageUrl = imageUrls[0];

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
