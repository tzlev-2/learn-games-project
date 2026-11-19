import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({

  envDir: '../../env',
  plugins: [
    tailwindcss({}),
    svelte({}),
  ],


  build: {
    outDir: 'dist',
    /* cssCodeSplit: false, */

    lib: {
      entry: {
        main: 'src/index.ts',

      },
      formats: ['es'],
      // fileName: 'main'
    },

    rollupOptions: {

      output: {
        entryFileNames: '[name].js',

      }
    }
  },

  server: {
    port: 443,

    host: '0.0.0.0', //'dev-server.dev',
    https: {
      key: 'dev-cert/dev-server.dev-key.pem',
      cert: 'dev-cert/dev-server.dev.pem'
    },
    cors: {
      origin: ['https://gingim.net', 'https://www.googleapis.com'],
      credentials: true
    },
    headers: {
      'Access-Control-Allow-Private-Network': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true'
    }
  },




  // הוספת תמיכה בקבצים מתיקיית temp
  //publicDir: 'temp'

  // בבדיקות: resolve של svelte לגרסת ה-client — נדרש ל-mount() של קומפוננטות ב-jsdom
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,

  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
  },
})
