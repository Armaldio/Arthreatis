import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import vercel from 'vite-plugin-vercel';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const newEnv = loadEnv(mode, process.cwd())
  console.log('newEnv', newEnv)
  return {
    plugins: [
      vue(),
      legacy(),
      // vercel(),
    ],
    vercel: {
      rewrites: [
        {
          "source": "/(.*)",
          "destination": "/index.html"
        }
      ],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom'
    }
  };
})
