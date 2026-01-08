import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only include Sentry plugin if environment variables are configured
    ...(process.env.VITE_SENTRY_ORG && process.env.VITE_SENTRY_PROJECT && process.env.VITE_SENTRY_AUTH_TOKEN
      ? [sentryVitePlugin({
          org: process.env.VITE_SENTRY_ORG,
          project: process.env.VITE_SENTRY_PROJECT,
          authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
        })]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.platform': '"browser"',
    'process.version': '"v18.0.0"',
    'process.browser': true,
    'process.nextTick': 'setTimeout',
  },
  optimizeDeps: {
    include: ['sockjs-client', '@stomp/stompjs'],
    exclude: [],
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
