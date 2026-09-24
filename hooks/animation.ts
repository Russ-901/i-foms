'use client';

// The accent hue used to continuously animate across the whole app (every
// button, border and status color drifting through the rainbow on a loop),
// which made the UI feel unstable and was impractical for a real tool where
// color should be a stable, readable signal. It's now a fixed brand hue —
// a green, matching the "i-FOMS Support" branding already used in the
// verification emails (lib/mailer.ts uses #16a34a, which is this same hue).
const BRAND_HUE = 142;

export default function useHueAnimation() {
  return BRAND_HUE;
}
