import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

// Cada cor aponta para um token definido em src/index.css (copiado de Docs/design/tokens.css).
// Sem cor solta nos componentes: sempre uma destas classes (bg-vm-navy-900, text-vm-gold-700, ...).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // "Até 768px" é mobile: o layout de desktop começa em 769px.
    screens: {
      sm: '640px',
      md: '769px',
      lg: '1024px',
      xl: '1280px',
    },
    container: {
      center: true,
      padding: '1.5rem',
      screens: { lg: '1200px' },
    },
    extend: {
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
          line: 'var(--vm-line)',
          'border-control': 'var(--vm-border-control)',
          'bar-dinheiro': 'var(--vm-bar-dinheiro)',
        },

        // Nomes esperados pelos componentes do shadcn/ui (variáveis HSL do tokens.css).
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        // Serifa só no título do hero da home; todo o resto é Hanken Grotesk.
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      spacing: { 'vm-2': '8px', 'vm-4': '16px', 'vm-6': '24px', 'vm-10': '40px' },
      borderRadius: {
        'vm-sm': '6px',
        'vm-md': '12px',
        'vm-pill': '999px',
        // Classes do shadcn/ui.
        md: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)',
        lg: 'calc(var(--radius) + 2px)',
      },
      fontSize: {
        'display-xl': ['68px', { lineHeight: '70px' }], // título do hero (Instrument Serif)
        'heading-l': ['32px', { lineHeight: '38px', letterSpacing: '-0.01em', fontWeight: '600' }],
        numeral: ['28px', { lineHeight: '32px', fontWeight: '300' }],
        title: ['20px', { lineHeight: '26px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        label: ['13px', { lineHeight: '16px', fontWeight: '500' }],
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      keyframes: {
        crescer: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        crescer: 'crescer 300ms ease-out both',
      },
    },
  },
  plugins: [animate],
} satisfies Config
