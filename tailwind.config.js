/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",   // Busca estilos en todos los archivos de la app
    "./components/**/*.{js,ts,jsx,tsx}", // Incluye tus componentes
  ],
  theme: {
    extend: {
      colors: {
        brand: "#2563eb",
        panel: "#111317",
        background: "#0b0c10",
      },
    },
  },
  plugins: [],
};
