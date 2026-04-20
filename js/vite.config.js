import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        servicios: resolve(__dirname, 'servicios.html'),
        soluciones: resolve(__dirname, 'soluciones.html'),
        casosDeExito: resolve(__dirname, 'casos-de-exito.html'),
        sobreNosotros: resolve(__dirname, 'sobre-nosotros.html'),
        blog: resolve(__dirname, 'blog.html'),
        contacto: resolve(__dirname, 'contacto.html'),
        landingRpa: resolve(__dirname, 'landing-rpa.html'),
      },
    },
  },
});