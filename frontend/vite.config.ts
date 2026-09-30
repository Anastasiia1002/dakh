import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

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

export default defineConfig({
  base: repoBase,
  plugins: [react(), tailwindcss(), redirectToBase()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
