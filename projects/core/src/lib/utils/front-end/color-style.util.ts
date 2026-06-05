
export type SurfaceVariant = 'soft' | 'solid' | 'outline';
export interface ColoredSurfaceOptions {
  variant?: SurfaceVariant;

  /**
   * Override border width.
   * @default '1.5px'
   */
  borderWidth?: string;
}

// ── Theme detection ───────────────────────────────────────────────────────────

type Theme = 'light' | 'dark';

function getActiveTheme(): Theme {
  // Matches ThemeService: document.body.setAttribute('data-zy-theme', ...)
  const attr = document.body.getAttribute('data-zy-theme');
  if (attr === 'dark') return 'dark';
  if (attr === 'light') return 'light';

  // Fallback — match ThemeService.getSystemTheme()
  const stored = localStorage.getItem('themeMode');
  if (stored === 'dark' || stored === 'light') return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ── Color-mix helpers ─────────────────────────────────────────────────────────
//
//  All anchors are hardcoded so the tint percentage is invariant.
//


const LIGHT = {
  bgBase: 'var(--mat-chip-bg)',
  bgMix: 15,
  textBase: 'var(--solarTextPrimary)',
  textMix: 94,
  borderBase: 'var(--mat-chip-bg)',
  borderMix: 12,
};

const DARK = {
  bgBase: 'var(--mat-chip-bg)',
  bgMix: 33,
  textBase: 'var(--solarTextPrimary)',
  textMix: 45,
  borderBase: 'var(--mat-chip-bg)',
  borderMix: 18,
};

function mix(color: string, pct: number, base: string): string {
  return `color-mix(in srgb, ${color} ${pct}%, ${base})`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function createColoredSurfaceStyle(
  baseColor?: string,
  options?: ColoredSurfaceOptions,
): Record<string, string> {

  if (!baseColor) return {};

  const {
    variant     = 'soft',
    borderWidth = '1.5px',
  } = options ?? {};

  const theme  = getActiveTheme();
  const t      = theme === 'dark' ? DARK : LIGHT;
  const border = `${borderWidth} solid`;

  switch (variant) {

    // ── SOFT ─────────────────────────────────────────────────────────────────
    //  Best for:  chips · badges · status pills · counters
    //
    //  Light: soft pastel bg keeps the UI airy; deep tinted text gives contrast
    //  Dark:  glowing tinted bg against near-black; bright text pops without
    //         burning — mimics Material You tonal surface pattern
    case 'soft': {

  if (theme === 'light') {
    return {
      background: `color-mix(in srgb, ${baseColor} 6%, transparent)`,
      border: `${border} ${baseColor}`,
      color: 'var(--solarTextPrimary)',
      borderRadius: '6px',
    };
  }

  return {
    background: `color-mix(in srgb, ${baseColor} 10%, transparent)`,
      border: `${border} ${baseColor}`,
      color: 'var(--solarTextPrimary)',
      borderRadius: '6px',
    };
}

    // ── SOLID ─────────────────────────────────────────────────────────────────
    //  Best for:  CTA tags · filled status chips · primary action labels
    //
    //  Light: full saturated color, white text — maximum hierarchy signal
    //  Dark:  slightly mixed with near-black so it doesn't oversaturate on
    //         dark surfaces; white text stays crisp
    case 'solid': {

  if (theme === 'light') {

    return {
      background: mix(baseColor, 15, '#ffffff'),

      border: `${border} ${mix(
        baseColor,
        16,
        '#ffffff'
      )}`,

      color: mix(
        baseColor,
        95,
        '#0d0d0d'
      ),

      borderRadius: '6px',
    };
  }

  return {
    background: mix(
      baseColor,
      55,
      '#141414'
    ),

    border: `${border} ${mix(
      baseColor,
      65,
      '#141414'
    )}`,

    color: mix(
      baseColor,
      30,
      'var(--solarTextPrimary)'
    ),

    borderRadius: '6px',
  };
}

    // ── OUTLINE ───────────────────────────────────────────────────────────────
    //  Best for:  ghost buttons · secondary labels · inactive toggles
    //
    //  Light: transparent bg, color border, color text — lightweight signal
    //  Dark:  border and text are brightened slightly (mixed toward off-white)
    //         so the outline is visible against dark backgrounds without
    //         changing the perceived hue
    case 'outline': {
      const darkFg = mix(baseColor, 80, '#f0f0f0');
      return {
        background:   'transparent',
        border:       `${border} ${theme === 'dark' ? darkFg : baseColor}`,
        color:        theme === 'dark' ? darkFg : baseColor,
        borderRadius: '6px',
      };
    }

    default:
      return {};
  }
}