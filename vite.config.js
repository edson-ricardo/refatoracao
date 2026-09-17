import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sobre: resolve(__dirname, 'templates/sobre.html'),
        contato: resolve(__dirname, 'templates/contato.html'),
        projetos: resolve(__dirname, 'templates/projetos.html'),
        habilidades: resolve(__dirname, 'templates/habilidades.html'),
        servicos: resolve(__dirname, 'templates/servicos.html'),
        depoimentos: resolve(__dirname, 'templates/depoimentos.html'),
        caseDeSucesso: resolve(__dirname, 'templates/case-de-sucesso.html'),
      },
    },
  },
});