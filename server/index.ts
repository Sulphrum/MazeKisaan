import { app } from './app.ts'

const PORT = parseInt(process.env.BACKEND_PORT || process.env.API_PORT || '5000')

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[माझे Kisan Backend] Server active and listening on http://localhost:${PORT}`)
  console.log(`[माझे Kisan Backend] API Health endpoint: http://localhost:${PORT}/api/health`)
})
