import type { Guest } from "@/lib/types";

// Generate 500 visually distinct colors using HSL color space
export function generateColorPalette(): string[] {
  const colors: string[] = [];

  // Parameters for color generation
  const hueSteps = 50; // Number of hue variations
  const saturationLevels = [60, 80, 100]; // Saturation percentages
  const lightnessLevels = [40, 55, 70]; // Lightness percentages

  let colorIndex = 0;

  // Generate colors by varying hue, saturation, and lightness
  for (let h = 0; h < 360 && colorIndex < 500; h += 360 / hueSteps) {
    for (const s of saturationLevels) {
      for (const l of lightnessLevels) {
        if (colorIndex >= 500) break;

        // Convert HSL to hex
        const color = hslToHex(h, s, l);
        colors.push(color);
        colorIndex++;
      }
      if (colorIndex >= 500) break;
    }
  }

  // If we still need more colors, add variations with different parameters
  while (colors.length < 500) {
    const h = (colors.length * 137.5) % 360; // Golden angle for good distribution
    const s = 50 + (colors.length % 5) * 10; // 50-90% saturation
    const l = 35 + (colors.length % 4) * 15; // 35-80% lightness
    colors.push(hslToHex(h, s, l));
  }

  return colors.slice(0, 500);
}

// Convert HSL to Hex color
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// Convert hex to RGB values
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}


// Get all guest colors ordered by proximity to target index
export function getNearbyGuestColors(
  targetIndex: number,
  guests: Guest[]
): string[] {
  const colorsWithDistance: Array<{ color: string; distance: number }> = [];

  // Check all guests and collect their colors with distance from target
  for (let i = 0; i < guests.length; i++) {
    // Skip the target guest itself and guests without colors
    if (i === targetIndex || !guests[i]?.family_color) {
      continue;
    }

    const distance = Math.abs(i - targetIndex);
    colorsWithDistance.push({
      color: guests[i].family_color!,
      distance: distance,
    });
  }

  // Sort by distance (closer guests first) and remove duplicates
  const seenColors = new Set<string>();
  return colorsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .filter(item => {
      if (seenColors.has(item.color)) {
        return false;
      }
      seenColors.add(item.color);
      return true;
    })
    .map(item => item.color);
}

// Create suggested color list prioritizing already used colors by nearby guests
export function createSuggestedColorList(
  palette: string[],
  nearbyUsedColors: string[]
): string[] {
  if (nearbyUsedColors.length === 0) {
    return palette; // Return original palette if no nearby colors are used
  }

  // Create a Set for fast lookup of nearby colors
  const nearbyColorSet = new Set(nearbyUsedColors);

  // Filter out the nearby colors from the palette to avoid duplicates
  const remainingColors = palette.filter(color => !nearbyColorSet.has(color));

  // Return nearby colors first (already sorted by distance), then remaining colors
  return [...nearbyUsedColors, ...remainingColors];
}

// Get suggested colors for a guest based on their position
export function getSuggestedColors(
  targetIndex: number,
  guests: Guest[],
  palette: string[] = generateColorPalette()
): string[] {
  const nearbyUsedColors = getNearbyGuestColors(targetIndex, guests);
  return createSuggestedColorList(palette, nearbyUsedColors);
}

// Get text color (black or white) that contrasts well with background color
export function getContrastTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);

  // Calculate relative luminance using W3C formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  // Return white text for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

// Cache for the color palette to avoid regenerating
let cachedColorPalette: string[] | null = null;

export function getColorPalette(): string[] {
  if (!cachedColorPalette) {
    cachedColorPalette = generateColorPalette();
  }
  return cachedColorPalette;
}
