import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vite'
import {
  productionApiBaseUrlError,
  resolvePublicApiBaseUrlFromValues,
} from './src/lib/publicBooking/productionApiUrl.ts'

const repoBase = '/dakh/'

function redirectToBase(): Plugin {
  return {
    name: 'redirect-to-base',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/') {
          res.statusCode = 302
          res.setHeader('Location', repoBase)
          res.end()
          return
        }
        next()
      })
    },
  }
}

function requireProductionApiUrl(): Plugin {
  return {
    name: 'require-production-api-url',
    apply: 'build',
    configResolved(config) {
      const fileEnv = loadEnv(config.mode, config.root, 'VITE_')
      const resolved = resolvePublicApiBaseUrlFromValues({
        VITE_PUBLIC_API_BASE_URL: process.env.VITE_PUBLIC_API_BASE_URL ?? fileEnv.VITE_PUBLIC_API_BASE_URL,
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? fileEnv.VITE_API_BASE_URL,
      })
      const error = productionApiBaseUrlError(resolved)
      if (error) throw new Error(error)
    },
  }
}

export default defineConfig({
  base: repoBase,
  plugins: [react(), tailwindcss(), redirectToBase(), requireProductionApiUrl()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
