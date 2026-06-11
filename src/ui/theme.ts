/** 逻辑分辨率与全局调色板（docs/06-art.md） */
export const W = 2048;
export const H = 1536;

export const COLORS = {
  bg: '#1C1A17',
  paper: '#E8DCC0',
  archiveGreen: '#3E5C4B',
  rustRed: '#8C3B2E',
  crtCyan: '#7FD4C1',
  past2001: '#A98E6F',
} as const;

export const FONT = {
  body: 'serif',
  mono: 'monospace',
} as const;
