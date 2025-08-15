/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Primary colors from output_example.html
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae0ff',
          300: '#7cc8ff',
          400: '#36a9ff',
          500: '#0084ff',
          600: '#0052cc', // Main primary color
          700: '#0047b3',
          800: '#003d99',
          900: '#003380',
        },
        // Gray scale for backgrounds and text
        gray: {
          50: '#f7f8f9', // Main background
          100: '#f4f5f7', // Card background alternative
          200: '#e4e6ea', // Progress bar background
          300: '#ddd', // Placeholder/disabled
          400: '#a5adba',
          500: '#6b778c', // Secondary text
          600: '#505f79',
          700: '#42526e',
          800: '#253858',
          900: '#172b4d', // Main text color
        },
        // Status colors
        success: {
          50: '#e3fcef',
          100: '#abf5d1',
          200: '#79f2c0',
          300: '#57d9a3',
          400: '#36b37e',
          500: '#00875a', // Success green
          600: '#006644',
          700: '#005a38',
          800: '#004b32',
          900: '#003d2b',
        },
        error: {
          50: '#ffebe6',
          100: '#ffbdad',
          200: '#ff8f73',
          300: '#ff6b47',
          400: '#ff5630',
          500: '#de350b', // Error red
          600: '#bf2600',
          700: '#a32000',
          800: '#8a1a00',
          900: '#731500',
        },
        warning: {
          50: '#fffae6',
          100: '#fff0b3',
          200: '#ffe380',
          300: '#ffd64d',
          400: '#ffcc02',
          500: '#ff991f',
          600: '#ff8b00',
          700: '#ff7a00',
          800: '#e56910',
          900: '#cc5500',
        },
        purple: {
          50: '#f3f0ff',
          100: '#e9e5ff',
          200: '#d1ccff',
          300: '#b8b0ff',
          400: '#9f94ff',
          500: '#6554c0', // Purple for merged PRs
          600: '#5243aa',
          700: '#403294',
          800: '#2d217e',
          900: '#1a1068',
        },
        // Platform badge colors
        badge: {
          blue: '#e3f2fd',
          'blue-text': '#0052cc',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '8px',
        badge: '4px',
        icon: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      gridTemplateColumns: {
        'auto-fill-380': 'repeat(auto-fill, minmax(380px, 1fr))',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
