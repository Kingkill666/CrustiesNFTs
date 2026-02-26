'use client';

import { ANIM_STYLES, FONT_FACES } from '@/features/app/components/theme';

interface CrustieNFTProps {
  size?: number;
  tokenId?: number;
  float?: boolean;
  wobble?: boolean;
  imageUrl?: string;
}

export function CrustieNFT({
  size = 200,
  tokenId = 1848,
  float: floatAnim = false,
  wobble = false,
  imageUrl = '/images/IMG_3692.jpeg',
}: CrustieNFTProps) {
  const animation = wobble
    ? 'wobble 2.4s ease-in-out infinite'
    : floatAnim
    ? 'float-pizza 3.5s ease-in-out infinite'
    : undefined;

  return (
    <>
      <style>{FONT_FACES + ANIM_STYLES}</style>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          overflow: 'hidden',
          position: 'relative',
          animation,
          flexShrink: 0,
        }}
      >
        {/* Shadow ellipse */}
        <div
          style={{
            position: 'absolute',
            bottom: -size * 0.06,
            left: '50%',
            transform: 'translateX(-50%)',
            width: size * 0.7,
            height: size * 0.1,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.12)',
            filter: 'blur(4px)',
            zIndex: 0,
          }}
        />

        {/* NFT image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Crustie #${tokenId}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            mixBlendMode: 'multiply',
            position: 'relative',
            zIndex: 1,
          }}
        />

        {/* Token badge */}
        {tokenId > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              background: 'rgba(0,0,0,0.55)',
              borderRadius: 99,
              padding: '2px 7px',
              zIndex: 2,
            }}
          >
            <span
              style={{
                color: '#fff',
                fontSize: size * 0.065,
                fontWeight: 800,
                letterSpacing: 0.3,
              }}
            >
              #{tokenId}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
