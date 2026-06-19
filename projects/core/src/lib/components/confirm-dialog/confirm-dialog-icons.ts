export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';
export type ConfirmDialogIcon = ConfirmDialogType | 'refresh';

/**
 * Custom illustrated icons per dialog type, matching the Solar design system
 * illustration style (rounded, friendly, two-tone). Inline SVG — no icon font,
 * no svgIcon registration required, full color control via theme tokens.
 */
export const CONFIRM_DIALOG_ICONS: Record<ConfirmDialogIcon, string> = {
  danger: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="var(--solarShadow, #E2E8F0)" opacity="0.5"/>
      <rect x="18" y="20" width="44" height="36" rx="8" fill="color-mix(in srgb, var(--actionRed) 22%, transparent)"/>
      <rect x="18" y="20" width="44" height="12" rx="8" fill="var(--actionRed)"/>
      <circle cx="25" cy="26" r="1.6" fill="white"/>
      <circle cx="30" cy="26" r="1.6" fill="white"/>
      <circle cx="35" cy="26" r="1.6" fill="white"/>
      <path d="M32 40 L48 40 M32 47 L42 47" stroke="white" stroke-width="3" stroke-linecap="round"/>
      <circle cx="58" cy="22" r="13" fill="var(--actionRed)" stroke="white" stroke-width="2.5"/>
      <path d="M58 16v7 M58 27v0.5" stroke="white" stroke-width="2.6" stroke-linecap="round"/>
    </svg>`,

  warning: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="var(--solarShadow, #E2E8F0)" opacity="0.5"/>
      <rect x="18" y="20" width="44" height="36" rx="8" fill="color-mix(in srgb, var(--actionOrange) 22%, transparent)"/>
      <rect x="18" y="20" width="44" height="12" rx="8" fill="var(--actionOrange)"/>
      <circle cx="25" cy="26" r="1.6" fill="white"/>
      <circle cx="30" cy="26" r="1.6" fill="white"/>
      <circle cx="35" cy="26" r="1.6" fill="white"/>
      <circle cx="35" cy="44" r="2" fill="var(--actionOrange)"/>
      <circle cx="45" cy="44" r="2" fill="var(--actionOrange)"/>
      <path d="M33 50 q7 -5 14 0" stroke="var(--actionOrange)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M58 13 L68 31 H48 Z" fill="var(--actionOrange)" stroke="white" stroke-width="2"/>
      <path d="M58 21v4" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <circle cx="58" cy="28" r="0.8" fill="white"/>
    </svg>`,

  info: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="var(--solarShadow, #E2E8F0)" opacity="0.5"/>
      <rect x="18" y="20" width="44" height="36" rx="8" fill="color-mix(in srgb, var(--primary500) 22%, transparent)"/>
      <rect x="18" y="20" width="44" height="12" rx="8" fill="var(--primary500)"/>
      <circle cx="25" cy="26" r="1.6" fill="white"/>
      <circle cx="30" cy="26" r="1.6" fill="white"/>
      <circle cx="35" cy="26" r="1.6" fill="white"/>
      <circle cx="35" cy="44" r="2" fill="var(--primary500)"/>
      <circle cx="45" cy="44" r="2" fill="var(--primary500)"/>
      <path d="M33 49 q7 4 14 0" stroke="var(--primary500)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M16 17 q-4 -1 -6 -4 M14 22 q-4 0 -7 -1" stroke="var(--primary500)" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
      <circle cx="58" cy="22" r="13" fill="var(--primary500)" stroke="white" stroke-width="2.5"/>
      <path d="M58 26v-6 M58 17v0.5" stroke="white" stroke-width="2.6" stroke-linecap="round"/>
    </svg>`,

  success: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="var(--solarShadow, #E2E8F0)" opacity="0.5"/>
      <rect x="18" y="20" width="44" height="36" rx="8" fill="color-mix(in srgb, var(--actionGreen) 22%, transparent)"/>
      <rect x="18" y="20" width="44" height="12" rx="8" fill="var(--actionGreen)"/>
      <circle cx="25" cy="26" r="1.6" fill="white"/>
      <circle cx="30" cy="26" r="1.6" fill="white"/>
      <circle cx="35" cy="26" r="1.6" fill="white"/>
      <circle cx="33" cy="44" r="2" fill="var(--actionGreen)"/>
      <circle cx="43" cy="44" r="2" fill="var(--actionGreen)"/>
      <path d="M31 49 q7 6 14 0" stroke="var(--actionGreen)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <circle cx="58" cy="22" r="13" fill="var(--actionGreen)" stroke="white" stroke-width="2.5"/>
      <path d="M52 22.5 l4 4 8 -8" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>` ,
    refresh: `
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="68" rx="22" ry="4" fill="var(--divider-border-color)" opacity="0.5"/>
      <rect x="18" y="20" width="44" height="36" rx="8" fill="color-mix(in srgb, var(--primary500) 22%, transparent)"/>
      <rect x="18" y="20" width="44" height="12" rx="8" fill="var(--primary500)"/>
      <circle cx="25" cy="26" r="1.6" fill="white"/>
      <circle cx="30" cy="26" r="1.6" fill="white"/>
      <circle cx="35" cy="26" r="1.6" fill="white"/>
      <circle cx="33" cy="44" r="2" fill="var(--primary500)"/>
      <circle cx="45" cy="44" r="2" fill="var(--primary500)"/>
      <path d="M31 49 q7 4 14 0" stroke="var(--primary500)" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M11 14 q-3 -2 -3 -6 M9 19 q-3 0 -5 -2" stroke="var(--primary500)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
      <circle cx="58" cy="22" r="13" fill="var(--primary500)" stroke="white" stroke-width="2.5"/>
      <path d="M52 16.5 a8 8 0 1 1 -2.3 9.3" stroke="white" stroke-width="2.4" stroke-linecap="round" fill="none"/>
      <path d="M52 13.5 v4.5 h4.3" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
};