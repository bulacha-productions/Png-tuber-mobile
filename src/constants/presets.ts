/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterConfig } from '../types.ts';

// Helper to encode SVG string into data URI
function svgToUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// Preset 1: Neko Gamer (Luna)
function generateLunaSvg(eyesOpen: boolean, mouthOpen: boolean): string {
  const eyeMarkup = eyesOpen
    ? `
      <!-- Eyes Open -->
      <ellipse cx="115" cy="140" rx="14" ry="19" fill="#1e1b4b" />
      <ellipse cx="185" cy="140" rx="14" ry="19" fill="#1e1b4b" />
      <ellipse cx="115" cy="138" rx="12" ry="17" fill="#818cf8" />
      <ellipse cx="185" cy="138" rx="12" ry="17" fill="#818cf8" />
      <ellipse cx="115" cy="142" rx="7" ry="10" fill="#312e81" />
      <ellipse cx="185" cy="142" rx="7" ry="10" fill="#312e81" />
      <!-- Eye Sparkles -->
      <circle cx="111" cy="132" r="5" fill="#ffffff" />
      <circle cx="181" cy="132" r="5" fill="#ffffff" />
      <circle cx="119" cy="146" r="2.5" fill="#ffffff" />
      <circle cx="189" cy="146" r="2.5" fill="#ffffff" />
      <!-- Eyebrows -->
      <path d="M102 118 Q115 112 128 118" stroke="#312e81" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M172 118 Q185 112 198 118" stroke="#312e81" stroke-width="4" stroke-linecap="round" fill="none" />
    `
    : `
      <!-- Eyes Closed (Blinking) -->
      <path d="M100 142 Q115 152 130 142" stroke="#312e81" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M170 142 Q185 152 200 142" stroke="#312e81" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M102 122 Q115 118 128 122" stroke="#312e81" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M172 122 Q185 118 198 122" stroke="#312e81" stroke-width="3" stroke-linecap="round" fill="none" />
    `;

  const mouthMarkup = mouthOpen
    ? `
      <!-- Mouth Open (Talking) -->
      <path d="M136 172 Q150 167 164 172 Q150 200 136 172 Z" fill="#e11d48" stroke="#881337" stroke-width="3" />
      <path d="M142 172 Q150 170 158 172 Q150 180 142 172 Z" fill="#ffffff" />
      <ellipse cx="150" cy="188" rx="8" ry="6" fill="#f43f5e" />
    `
    : `
      <!-- Mouth Closed (Idle) -->
      <path d="M142 173 Q150 177 158 173" stroke="#be185d" stroke-width="4" stroke-linecap="round" fill="none" />
    `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" width="300" height="340">
    <defs>
      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#a78bfa" />
        <stop offset="100%" stop-color="#6366f1" />
      </linearGradient>
      <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#312e81" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>
    </defs>
    <!-- Cat Ears Back -->
    <polygon points="65,95 100,20 125,75" fill="#6366f1" />
    <polygon points="75,90 100,35 118,75" fill="#f472b6" />
    <polygon points="235,95 200,20 175,75" fill="#6366f1" />
    <polygon points="225,90 200,35 182,75" fill="#f472b6" />

    <!-- Headphone Band -->
    <path d="M70 120 C60 40, 240 40, 230 120" stroke="#0f172a" stroke-width="14" fill="none" stroke-linecap="round" />
    <path d="M70 120 C60 40, 240 40, 230 120" stroke="#38bdf8" stroke-width="4" fill="none" stroke-linecap="round" />

    <!-- Back Hair -->
    <path d="M70 100 C50 180, 60 250, 80 270 C100 240, 80 180, 90 140" fill="#4f46e5" />
    <path d="M230 100 C250 180, 240 250, 220 270 C200 240, 220 180, 210 140" fill="#4f46e5" />

    <!-- Body & Hoodie -->
    <path d="M75 290 Q150 250 225 290 L245 340 L55 340 Z" fill="url(#hoodieGrad)" />
    <!-- Hoodie Strings & Decals -->
    <path d="M125 285 Q135 320 130 335" stroke="#f472b6" stroke-width="4" stroke-linecap="round" fill="none" />
    <path d="M175 285 Q165 320 170 335" stroke="#f472b6" stroke-width="4" stroke-linecap="round" fill="none" />
    <circle cx="150" cy="305" r="10" fill="#6366f1" opacity="0.8" />

    <!-- Neck -->
    <rect x="135" y="210" width="30" height="40" rx="10" fill="#fed7aa" />

    <!-- Face Shape -->
    <path d="M85 130 C85 70, 215 70, 215 130 C215 200, 185 225, 150 225 C115 225, 85 200, 85 130 Z" fill="#ffedd5" />
    
    <!-- Blush -->
    <ellipse cx="102" cy="160" rx="12" ry="7" fill="#fda4af" opacity="0.65" />
    <ellipse cx="198" cy="160" rx="12" ry="7" fill="#fda4af" opacity="0.65" />

    <!-- Front Bangs Hair -->
    <path d="M75 110 C90 70, 210 70, 225 110 C210 105, 195 125, 180 105 C165 130, 145 95, 130 115 C115 95, 95 120, 75 110 Z" fill="url(#hairGrad)" />
    <!-- Side Hair Tufts -->
    <path d="M78 110 Q70 170 88 190 Q90 140 85 110 Z" fill="#6366f1" />
    <path d="M222 110 Q230 170 212 190 Q210 140 215 110 Z" fill="#6366f1" />

    <!-- Eyes (Dynamic) -->
    ${eyeMarkup}

    <!-- Nose -->
    <circle cx="150" cy="158" r="2" fill="#f97316" opacity="0.6" />

    <!-- Mouth (Dynamic) -->
    ${mouthMarkup}

    <!-- Headphone Ear Cups -->
    <rect x="52" y="115" width="22" height="40" rx="11" fill="#0f172a" />
    <rect x="55" y="120" width="16" height="30" rx="8" fill="#38bdf8" />
    <rect x="226" y="115" width="22" height="40" rx="11" fill="#0f172a" />
    <rect x="229" y="120" width="16" height="30" rx="8" fill="#38bdf8" />
  </svg>`;
}

// Preset 2: Kaito Gamer
function generateKaitoSvg(eyesOpen: boolean, mouthOpen: boolean): string {
  const eyeMarkup = eyesOpen
    ? `
      <ellipse cx="118" cy="138" rx="12" ry="16" fill="#0f172a" />
      <ellipse cx="182" cy="138" rx="12" ry="16" fill="#0f172a" />
      <ellipse cx="118" cy="137" rx="10" ry="14" fill="#06b6d4" />
      <ellipse cx="182" cy="137" rx="10" ry="14" fill="#06b6d4" />
      <circle cx="114" cy="132" r="4.5" fill="#ffffff" />
      <circle cx="178" cy="132" r="4.5" fill="#ffffff" />
      <path d="M104 116 Q118 112 132 118" stroke="#1e293b" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M168 118 Q182 112 196 116" stroke="#1e293b" stroke-width="4" stroke-linecap="round" fill="none" />
    `
    : `
      <path d="M104 140 Q118 132 132 140" stroke="#1e293b" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M168 140 Q182 132 196 140" stroke="#1e293b" stroke-width="4" stroke-linecap="round" fill="none" />
      <path d="M104 120 Q118 116 132 120" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M168 120 Q182 116 196 120" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none" />
    `;

  const mouthMarkup = mouthOpen
    ? `
      <path d="M138 174 Q150 170 162 174 Q150 198 138 174 Z" fill="#be123c" stroke="#881337" stroke-width="2.5" />
      <path d="M142 174 Q150 172 158 174" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
    `
    : `
      <path d="M144 175 Q150 179 156 175" stroke="#9f1239" stroke-width="3.5" stroke-linecap="round" fill="none" />
    `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" width="300" height="340">
    <defs>
      <linearGradient id="kaitoHair" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="kaitoJacket" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0ea5e9" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
    </defs>
    <!-- Headset Band -->
    <path d="M68 115 C60 40, 240 40, 232 115" stroke="#334155" stroke-width="12" fill="none" stroke-linecap="round" />
    <path d="M72 115 C64 45, 236 45, 228 115" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round" />

    <!-- Jacket & Shoulders -->
    <path d="M70 285 Q150 255 230 285 L245 340 L55 340 Z" fill="url(#kaitoJacket)" />
    <!-- T-shirt Underneath -->
    <polygon points="125,270 175,270 150,310" fill="#0f172a" />

    <!-- Neck -->
    <rect x="135" y="210" width="30" height="40" rx="6" fill="#fde68a" />

    <!-- Face Shape -->
    <path d="M90 125 C90 70, 210 70, 210 125 C210 195, 180 225, 150 225 C120 225, 90 195, 90 125 Z" fill="#fef3c7" />

    <!-- Spiky Hair -->
    <path d="M75 115 C70 60, 110 30, 150 35 C190 30, 230 60, 225 115 L215 95 C205 75, 185 85, 175 75 C165 95, 145 75, 135 90 C125 70, 105 85, 95 80 C85 95, 80 110, 75 115 Z" fill="url(#kaitoHair)" />
    <path d="M75 115 L85 160 L92 120" fill="url(#kaitoHair)" />
    <path d="M225 115 L215 160 L208 120" fill="url(#kaitoHair)" />

    <!-- Eyes (Dynamic) -->
    ${eyeMarkup}

    <!-- Nose -->
    <path d="M150 155 L148 160" stroke="#d97706" stroke-width="2" stroke-linecap="round" />

    <!-- Mouth (Dynamic) -->
    ${mouthMarkup}

    <!-- Headset Cups & Mic -->
    <rect x="52" y="110" width="22" height="38" rx="8" fill="#1e293b" />
    <rect x="226" y="110" width="22" height="38" rx="8" fill="#1e293b" />
    <!-- Boom Mic -->
    <path d="M68 135 Q90 165 125 170" stroke="#475569" stroke-width="4" fill="none" stroke-linecap="round" />
    <circle cx="128" cy="170" r="6" fill="#0ea5e9" />
  </svg>`;
}

// Preset 3: Chibi Kitsune
function generateKitsuneSvg(eyesOpen: boolean, mouthOpen: boolean): string {
  const eyeMarkup = eyesOpen
    ? `
      <ellipse cx="115" cy="142" rx="14" ry="18" fill="#831843" />
      <ellipse cx="185" cy="142" rx="14" ry="18" fill="#831843" />
      <ellipse cx="115" cy="140" rx="12" ry="15" fill="#f43f5e" />
      <ellipse cx="185" cy="140" rx="12" ry="15" fill="#f43f5e" />
      <circle cx="111" cy="134" r="5" fill="#ffffff" />
      <circle cx="181" cy="134" r="5" fill="#ffffff" />
      <circle cx="118" cy="146" r="2.5" fill="#ffffff" />
      <circle cx="188" cy="146" r="2.5" fill="#ffffff" />
      <path d="M102 122 Q115 116 128 122" stroke="#831843" stroke-width="3.5" stroke-linecap="round" fill="none" />
      <path d="M172 122 Q185 116 198 122" stroke="#831843" stroke-width="3.5" stroke-linecap="round" fill="none" />
    `
    : `
      <path d="M102 144 Q115 152 128 144" stroke="#831843" stroke-width="4.5" stroke-linecap="round" fill="none" />
      <path d="M172 144 Q185 152 198 144" stroke="#831843" stroke-width="4.5" stroke-linecap="round" fill="none" />
      <path d="M104 124 Q115 120 126 124" stroke="#831843" stroke-width="3" stroke-linecap="round" fill="none" />
      <path d="M174 124 Q185 120 196 124" stroke="#831843" stroke-width="3" stroke-linecap="round" fill="none" />
    `;

  const mouthMarkup = mouthOpen
    ? `
      <path d="M136 174 Q150 168 164 174 Q150 202 136 174 Z" fill="#e11d48" stroke="#9f1239" stroke-width="2.5" />
      <path d="M142 174 Q150 172 158 174 Q150 182 142 174 Z" fill="#ffffff" />
      <circle cx="150" cy="190" r="7" fill="#fb7185" />
    `
    : `
      <!-- Cat/Fox smile :3 -->
      <path d="M138 174 Q144 178 150 174 Q156 178 162 174" stroke="#9f1239" stroke-width="3.5" stroke-linecap="round" fill="none" />
    `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" width="300" height="340">
    <defs>
      <linearGradient id="foxEars" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ea580c" />
        <stop offset="100%" stop-color="#c2410c" />
      </linearGradient>
    </defs>
    <!-- Fox Ears -->
    <polygon points="60,110 90,15 130,85" fill="url(#foxEars)" />
    <polygon points="75,95 95,35 120,80" fill="#fff7ed" />
    <polygon points="240,110 210,15 170,85" fill="url(#foxEars)" />
    <polygon points="225,95 205,35 180,80" fill="#fff7ed" />

    <!-- Kimono / Robe -->
    <path d="M70 280 Q150 250 230 280 L245 340 L55 340 Z" fill="#be123c" />
    <!-- Kimono Collar -->
    <path d="M110 270 L150 320 L190 270" stroke="#fef08a" stroke-width="8" fill="none" />
    <circle cx="150" cy="315" r="10" fill="#eab308" />

    <!-- Neck -->
    <rect x="135" y="210" width="30" height="40" rx="8" fill="#fde68a" />

    <!-- Face Shape -->
    <path d="M85 130 C85 70, 215 70, 215 130 C215 200, 185 225, 150 225 C115 225, 85 200, 85 130 Z" fill="#fef3c7" />

    <!-- Red Kitsune Cheek Marks -->
    <path d="M82 155 L102 155 M80 162 L98 162" stroke="#e11d48" stroke-width="3" stroke-linecap="round" />
    <path d="M218 155 L198 155 M220 162 L202 162" stroke="#e11d48" stroke-width="3" stroke-linecap="round" />

    <!-- White Hair with orange streaks -->
    <path d="M75 110 C90 70, 210 70, 225 110 C215 95, 195 115, 180 100 C165 120, 145 95, 130 115 C115 95, 95 120, 75 110 Z" fill="#fff7ed" />
    <path d="M140 75 Q150 115 158 85" fill="#f97316" />

    <!-- Eyes (Dynamic) -->
    ${eyeMarkup}

    <!-- Nose -->
    <ellipse cx="150" cy="160" rx="2.5" ry="2" fill="#831843" />

    <!-- Mouth (Dynamic) -->
    ${mouthMarkup}
  </svg>`;
}

export const PRESET_CHARACTERS: CharacterConfig[] = [
  {
    id: 'luna-neko',
    name: 'Luna Neko (Streamer)',
    images: {
      eyesOpenMouthClosed: svgToUri(generateLunaSvg(true, false)),
      eyesOpenMouthOpen: svgToUri(generateLunaSvg(true, true)),
      eyesClosedMouthClosed: svgToUri(generateLunaSvg(false, false)),
      eyesClosedMouthOpen: svgToUri(generateLunaSvg(false, true)),
    },
    scale: 1.0,
    positionX: 75,
    positionY: 65,
    flipHorizontal: false,
    rotation: 0,
    bounceStrength: 12,
    bounceSpeed: 140,
    blinkInterval: 4000,
    blinkDuration: 150,
  },
  {
    id: 'kaito-gamer',
    name: 'Kaito (Pro Gamer)',
    images: {
      eyesOpenMouthClosed: svgToUri(generateKaitoSvg(true, false)),
      eyesOpenMouthOpen: svgToUri(generateKaitoSvg(true, true)),
      eyesClosedMouthClosed: svgToUri(generateKaitoSvg(false, false)),
      eyesClosedMouthOpen: svgToUri(generateKaitoSvg(false, true)),
    },
    scale: 1.0,
    positionX: 75,
    positionY: 65,
    flipHorizontal: false,
    rotation: 0,
    bounceStrength: 10,
    bounceSpeed: 130,
    blinkInterval: 4200,
    blinkDuration: 160,
  },
  {
    id: 'yuki-kitsune',
    name: 'Yuki (Kitsune Spirit)',
    images: {
      eyesOpenMouthClosed: svgToUri(generateKitsuneSvg(true, false)),
      eyesOpenMouthOpen: svgToUri(generateKitsuneSvg(true, true)),
      eyesClosedMouthClosed: svgToUri(generateKitsuneSvg(false, false)),
      eyesClosedMouthOpen: svgToUri(generateKitsuneSvg(false, true)),
    },
    scale: 1.0,
    positionX: 75,
    positionY: 65,
    flipHorizontal: false,
    rotation: 0,
    bounceStrength: 14,
    bounceSpeed: 150,
    blinkInterval: 3800,
    blinkDuration: 140,
  },
];
