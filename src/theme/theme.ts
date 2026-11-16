export type ThemeMode = 'dark' | 'light';

export interface ThemePalette {
  mode: ThemeMode;
  background: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  border: string;
  darkCard: string;
  darkCardInk: string;
  darkCardMuted: string;
  warning: string;
  warningInk: string;
  success: string;
  danger: string;
}

export const palettes: Record<ThemeMode, ThemePalette> = {
  dark: {
    mode: 'dark',
    background: '#080E16',
    surface: '#111A24',
    surfaceAlt: '#162231',
    ink: '#F4F8FB',
    muted: '#9DB1C4',
    accent: '#00E0B8',
    accentSoft: '#0C3B35',
    border: '#263647',
    darkCard: '#0E1925',
    darkCardInk: '#F4F8FB',
    darkCardMuted: '#8FB0C4',
    warning: '#332708',
    warningInk: '#FFE7A8',
    success: '#00E0B8',
    danger: '#FF6B6B',
  },
  light: {
    mode: 'light',
    background: '#F2F6F5',
    surface: '#FFFFFF',
    surfaceAlt: '#F7FAF9',
    ink: '#102A2A',
    muted: '#637A71',
    accent: '#087F5B',
    accentSoft: '#E8F5EF',
    border: '#DCE8E2',
    darkCard: '#102A2A',
    darkCardInk: '#FFFFFF',
    darkCardMuted: '#BFD4CC',
    warning: '#FFF4D6',
    warningInk: '#7A4B00',
    success: '#087F5B',
    danger: '#A61B1B',
  },
};