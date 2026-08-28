import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import sendAdminOtpEmail from './api/send-admin-otp-email.js'
import sendPdfAccessEmail from './api/send-pdf-access-email.js'

const apiRoutes = {
  '/api/send-admin-otp-email': sendAdminOtpEmail,
  '/api/send-pdf-access-email': sendPdfAccessEmail,
}

const attachLocalApiRoutes = (server) => {
  server.middlewares.use(async (request, response, next) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname.replace(/\/+$/, '')
    const handler = apiRoutes[pathname] || apiRoutes[`${pathname}/`]

    if (!handler) {
      next()
      return
    }

    try {
      await handler(request, response)
    } catch (error) {
      if (!response.headersSent) {
        response.statusCode = 500
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
      }

      response.end(JSON.stringify({
        message: error?.message || 'Local API route failed.',
      }))
    }
  })
}

const localApiPlugin = () => ({
  name: 'local-api-routes',
  configureServer: attachLocalApiRoutes,
  configurePreviewServer: attachLocalApiRoutes,
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  Object.entries(env).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  })

  return {
    plugins: [localApiPlugin(), react()],
    base: '/',
    server: {
      host: '0.0.0.0',
    },
  }
})
