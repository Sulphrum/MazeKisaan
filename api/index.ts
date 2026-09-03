import type { Request, Response } from 'express'
import { app } from '../server/app.ts'

export default function handler(req: Request, res: Response) {
  const incoming = new URL(req.url || '/', 'http://vercel.local')
  const apiPath = incoming.searchParams.get('__path') || ''

  incoming.searchParams.delete('__path')
  const query = incoming.searchParams.toString()
  req.url = `/api/${apiPath}${query ? `?${query}` : ''}`

  return app(req, res)
}
