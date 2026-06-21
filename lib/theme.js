export const theme = {
  colors: {
    // Brand Tokens
    primary: '#0284c7', // sky-600 (Accessible)
    secondary: '#4f46e5', // indigo-600
    
    // UI Tokens
    background: '#f8fafc', // slate-50
    foreground: '#0f172a', // slate-900
    textMuted: '#475569', // slate-600 (Accessible overriding slate-400)
    border: '#e2e8f0', // slate-200
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  spacing: {
    '1': '0.25rem', // 4px
    '2': '0.5rem',  // 8px
    '3': '0.75rem', // 12px
    '4': '1rem',    // 16px
    '6': '1.5rem',  // 24px
    '8': '2rem',    // 32px
    '12': '3rem',   // 48px
  },
  animations: {
    transitions: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easings: {
      inOut: 'ease-in-out',
      out: 'ease-out',
    }
  }
};
