/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const primary = '#7c3aed'; // violet-600
const primaryAlt = '#22d3ee'; // cyan-400
const accent = '#f59e0b'; // amber-500
const success = '#10b981';
const danger = '#ef4444';

export const Colors = {
  light: {
    text: '#0b1220',
    background: '#f8fafc',
    tint: primary,
    icon: '#334155',
    tabIconDefault: '#64748b',
    tabIconSelected: primary,
    primary,
    primaryAlt,
    accent,
    success,
    danger,
    card: '#ffffff',
    cardAlt: '#f1f5f9',
  },
  dark: {
    text: '#e5e7eb',
    background: '#0b1220',
    tint: '#ffffff',
    icon: '#9ca3af',
    tabIconDefault: '#9ca3af',
    tabIconSelected: '#ffffff',
    primary,
    primaryAlt,
    accent,
    success,
    danger,
    card: '#0f172a',
    cardAlt: '#0b1220',
  },
};
