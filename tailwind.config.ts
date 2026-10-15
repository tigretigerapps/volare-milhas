import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

// Cada cor aponta para um token semântico definido em src/index.css.
// Os tokens guardam canais RGB para permitir modificadores de opacidade (ex.: bg-texto/10).
const token = (nome: string) => `rgb(var(--${nome}) / <alpha-value>)`

export default {
  darkMode: 'class',
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
      padding: '1rem',
      screens: { lg: '1120px' },
    },
    extend: {
      colors: {
        fundo: token('fundo'),
        superficie: token('superficie'),
        texto: token('texto'),
        'texto-secundario': token('texto-secundario'),
        economia: token('economia'),
        'economia-texto': token('economia-texto'),
        dinheiro: token('dinheiro'),
        fio: token('fio'),
        alerta: token('alerta'),
        primario: {
          DEFAULT: token('primario'),
          texto: token('primario-texto'),
        },

        // Nomes esperados pelos componentes do shadcn/ui, mapeados para os tokens acima.
        background: token('fundo'),
        foreground: token('texto'),
        border: token('fio'),
        input: token('fio'),
        ring: token('texto'),
        primary: {
          DEFAULT: token('primario'),
          foreground: token('primario-texto'),
        },
        muted: {
          DEFAULT: token('fundo'),
          foreground: token('texto-secundario'),
        },
        popover: {
          DEFAULT: token('superficie'),
          foreground: token('texto'),
        },
      },
      fontFamily: {
        sans: ['Lexend', 'system-ui', 'sans-serif'],
        display: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: 'var(--raio)',
        sm: 'calc(var(--raio) - 2px)',
        lg: 'calc(var(--raio) + 2px)',
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
