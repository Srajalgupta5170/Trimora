/**
 * Theme constants for consistent styling across the app
 * Premium dark theme with purple/blue gradients
 */

export const THEME = {
  // Background colors
  bg: {
    primary: 'bg-slate-950',      // Main app background
    secondary: 'bg-slate-900',    // Card backgrounds
    tertiary: 'bg-slate-800',     // Hover states
    light: 'bg-slate-700',        // Text backgrounds
  },

  // Text colors
  text: {
    primary: 'text-slate-100',    // Primary text
    secondary: 'text-slate-300',  // Secondary text
    muted: 'text-slate-400',      // Muted text
    accent: 'text-purple-400',    // Accent text
  },

  // Border colors
  border: {
    primary: 'border-slate-700',  // Main borders
    light: 'border-slate-600',    // Lighter borders
    accent: 'border-purple-500',  // Accent borders
  },

  // Gradients
  gradient: {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600',
    subtle: 'bg-gradient-to-r from-purple-900/20 to-blue-900/20',
    hover: 'hover:from-purple-700 hover:to-blue-700',
  },

  // Status colors
  status: {
    success: 'text-emerald-400 bg-emerald-900/20',
    error: 'text-red-400 bg-red-900/20',
    warning: 'text-amber-400 bg-amber-900/20',
    info: 'text-blue-400 bg-blue-900/20',
  },

  // Component styles
  card: 'bg-slate-900 border border-slate-700 rounded-lg shadow-lg',
  button: {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium transition-colors',
    ghost: 'hover:bg-slate-800 text-slate-300 font-medium transition-colors',
  },

  // Input styles
  input: 'bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
};

// Utility function for responsive breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

// Common className patterns
export const CLASSES = {
  // Cards and containers
  card: `${THEME.card} p-4`,
  cardLg: `${THEME.card} p-6`,

  // Buttons
  btnPrimary: `${THEME.button.primary} px-4 py-2 rounded-lg transition-all`,
  btnPrimaryLg: `${THEME.button.primary} px-6 py-3 rounded-lg transition-all text-lg`,
  btnSecondary: `${THEME.button.secondary} px-4 py-2 rounded-lg transition-all`,
  btnGhost: `${THEME.button.ghost} px-4 py-2 rounded-lg transition-all`,

  // Touch-friendly button (44px minimum)
  btnTouch: `${THEME.button.primary} px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center justify-center`,
  btnTouchSecondary: `${THEME.button.secondary} px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center justify-center`,

  // Inputs
  input: `${THEME.input} px-4 py-2 w-full min-h-[44px]`,

  // Text
  heading1: `${THEME.text.primary} text-4xl font-bold`,
  heading2: `${THEME.text.primary} text-3xl font-bold`,
  heading3: `${THEME.text.primary} text-2xl font-bold`,
  heading4: `${THEME.text.primary} text-xl font-semibold`,
  subtitle: `${THEME.text.secondary} text-lg`,
  body: `${THEME.text.secondary}`,
  small: `${THEME.text.muted} text-sm`,
};

export default THEME;
