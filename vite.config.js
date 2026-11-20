import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Serves /api/explain (the same handler Vercel runs in production) from the dev and preview
// servers. Only the server-side variables below are copied into process.env; nothing from
// .env.local is ever exposed to the browser, because none of these names start with VITE_.
const SERVER_VARS = ['GROQ_API_KEY', 'GROQ_MODEL', 'EXPLAIN_RATE_PER_MIN', 'EXPLAIN_GLOBAL_PER_MIN', 'TRUSTED_PROXY_HOPS']

function apiPlugin(env) {
  const load = async (server) => (server ? server.ssrLoadModule('/api/explain.js') : import('./api/explain.js'))
  const attach = (middlewares, server) => {
    middlewares.use('/api/explain', async (req, res) => {
      try {
        const mod = await load(server)
        await mod.default(req, res)
      } catch (e) {
        console.error('[api/explain]', e?.message ?? e)
        if (!res.headersSent) { res.statusCode = 500; res.setHeader('Content-Type', 'application/json') }
        if (!res.writableEnded) res.end(JSON.stringify({ error: 'Server error.' }))
      }
    })
  }
  return {
    name: 'local-api',
    configureServer(server) {
      for (const k of SERVER_VARS) if (env[k] !== undefined) process.env[k] = env[k]
      attach(server.middlewares, server)
    },
    configurePreviewServer(server) {
      for (const k of SERVER_VARS) if (env[k] !== undefined) process.env[k] = env[k]
      attach(server.middlewares, null)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), tailwindcss(), apiPlugin(env)] }
})
