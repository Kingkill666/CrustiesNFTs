"use client";

interface PizzaPreviewProps {
  imageUrl: string;
  traits: Record<string, string>;
}

function resolveIpfsUrl(url: string): string {
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }
  return url;
}

function formatTraitName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTraitValue(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PizzaPreview({ imageUrl, traits }: PizzaPreviewProps) {
  return (
    <div className="w-full rounded-2xl border border-gray-700 bg-gray-900 p-4">
      {/* Image */}
      <div className="mb-4 overflow-hidden rounded-xl">
        <img
          src={resolveIpfsUrl(imageUrl)}
          alt="Your Crusties pizza PFP"
          className="aspect-square w-full object-cover"
        />
      </div>

      {/* Traits */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(traits).map(([key, value]) => (
          <div
            key={key}
            className="rounded-lg bg-gray-800 px-3 py-2 text-center"
          >
            <p className="text-xs text-gray-500">{formatTraitName(key)}</p>
            <p className="text-sm font-medium text-pizza-cheese">
              {formatTraitValue(String(value))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
