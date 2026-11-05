# Tailwind: extensão do tema

Cole em `tailwind.config.ts`, dentro de `theme.extend`. Os nomes batem com os tokens do design system.

```ts
colors: {
  vm: {
    'navy-900': 'var(--vm-navy-900)',
    'navy-700': 'var(--vm-navy-700)',
    'gold-500': 'var(--vm-gold-500)',
    'gold-700': 'var(--vm-gold-700)',
    'gold-300': 'var(--vm-gold-300)',
    'burgundy-600': 'var(--vm-burgundy-600)',
    'surface-page': 'var(--vm-surface-page)',
    'surface-card': 'var(--vm-surface-card)',
    'ink-muted': 'var(--vm-ink-muted)',
    'line': 'var(--vm-line)',
    'border-control': 'var(--vm-border-control)',
    'bar-dinheiro': 'var(--vm-bar-dinheiro)',
  },
},
fontFamily: {
  display: ['"Instrument Serif"', 'Georgia', 'serif'],
  sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
},
spacing: { 'vm-2': '8px', 'vm-4': '16px', 'vm-6': '24px', 'vm-10': '40px' },
borderRadius: { 'vm-sm': '6px', 'vm-md': '12px', 'vm-pill': '999px' },
fontSize: {
  'display-xl': ['68px', { lineHeight: '70px' }],   // título do hero (Instrument Serif)
  'heading-l':  ['32px', { lineHeight: '38px', letterSpacing: '-0.01em', fontWeight: '600' }],
  'numeral':    ['28px', { lineHeight: '32px', fontWeight: '300' }],
  'title':      ['20px', { lineHeight: '26px', fontWeight: '600' }],
  'body':       ['16px', { lineHeight: '24px' }],
  'body-sm':    ['14px', { lineHeight: '20px' }],
  'label':      ['13px', { lineHeight: '16px', fontWeight: '500' }],
},
```

Uso: `bg-vm-navy-900`, `text-vm-gold-700`, `rounded-vm-md`, `text-title`, `font-display`.
