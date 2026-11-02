export default {
  content: ['index.html', 'src/**/*.ts'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0fdfa', 100: '#ccfbf1', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59' },
        accent: { 500: '#6366f1', 600: '#4f46e5' }
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    }
  }
};
