export const THEME_CSS = `
.bp-themed {
  --bp-bg: hsl(0 0% 100%);
  --bp-fg: hsl(240 10% 3.9%);
  --bp-muted: hsl(240 3.8% 46.1%);
  --bp-border: hsl(240 5.9% 90%);
  --bp-accent: hsl(240 4.8% 95.9%);
  --bp-track: hsl(240 5% 78%);
  --bp-ring: hsl(240 5% 64.9%);
  --bp-green: hsl(142 71% 40%);
  --bp-yellow: hsl(38 92% 45%);
  --bp-red: hsl(0 84% 55%);
}

@media (prefers-color-scheme: dark) {
  .bp-themed {
    --bp-bg: hsl(240 10% 5%);
    --bp-fg: hsl(0 0% 98%);
    --bp-muted: hsl(240 5% 64.9%);
    --bp-border: hsl(240 3.7% 17%);
    --bp-accent: hsl(240 3.7% 13%);
    --bp-track: hsl(240 3.7% 28%);
    --bp-green: hsl(142 71% 45%);
    --bp-yellow: hsl(38 92% 50%);
    --bp-red: hsl(0 84% 60%);
  }
}
`