import { injectStyle } from '@nolly/core'

const CSS = `
html.dark .bp-themed {
  --bp-bg: hsl(0 0% 13%);
  --bp-fg: hsl(0 0% 98%);
  --bp-muted: hsl(0 0% 64%);
  --bp-border: hsl(0 0% 24%);
  --bp-accent: hsl(0 0% 18%);
  --bp-track: hsl(0 0% 30%);
  --bp-ring: hsl(0 0% 60%);
  --bp-green: hsl(142 71% 45%);
  --bp-yellow: hsl(38 92% 50%);
  --bp-red: hsl(0 84% 60%);
}

html.light .bp-themed {
  --bp-bg: hsl(0 0% 100%);
  --bp-fg: hsl(0 0% 6%);
  --bp-muted: hsl(0 0% 42%);
  --bp-border: hsl(0 0% 88%);
  --bp-accent: hsl(0 0% 95%);
  --bp-track: hsl(0 0% 78%);
  --bp-ring: hsl(0 0% 60%);
  --bp-green: hsl(142 71% 40%);
  --bp-yellow: hsl(38 92% 45%);
  --bp-red: hsl(0 84% 55%);
}

.bp-tip-mode { font-weight: 600; }
.bp-tip-sub { color: var(--bp-muted); }
.bp-tip-foot { margin-top: 4px; color: var(--bp-muted); font-size: 11px; }
`

export const installTheme = (): void => injectStyle('better-chatgpt-theme', CSS)
