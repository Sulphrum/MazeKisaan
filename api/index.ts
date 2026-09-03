import type { Request, Response } from 'express'
import { app } from '../server/app.ts'
import { db } from '../server/db/store.ts'

let requestQueue: Promise<void> = Promise.resolve()

async function handleRequest(req: Request, res: Response) {
  await db.syncFromPersistentStorage()

  // Hold JSON responses until a mutation has reached durable storage. This
  // prevents a fast account switch from reading stale demand or chat data.
  const sendJson = res.json.bind(res)
  res.json = ((body: unknown) => {
    void db.flushPersistentStorage()
      .then(() => sendJson(body))
      .catch((error) => {
        console.error('[Persistent write error]:', error)
        if (!res.headersSent) {
          res.status(503)
          sendJson({ error: 'Your change could not be saved permanently. Please try again.' })
        }
      })
    return res
  }) as Response['json']

  const incoming = new URL(req.url || '/', 'http://vercel.local')
  const apiPath = incoming.searchParams.get('__path') || ''

  incoming.searchParams.delete('__path')
  const query = incoming.searchParams.toString()
  req.url = `/api/${apiPath}${query ? `?${query}` : ''}`

  await new Promise<void>((resolve, reject) => {
    res.once('finish', resolve)
    res.once('close', resolve)
    try {
      app(req, res)
    } catch (error) {
      reject(error)
    }
  })

  await db.flushPersistentStorage()
}

export default function handler(req: Request, res: Response) {
  const run = requestQueue.then(() => handleRequest(req, res))
  requestQueue = run.then(() => undefined, () => undefined)
  return run.catch((error) => {
    console.error('[Persistent API Error]:', error)
    if (!res.headersSent) res.status(503).json({ error: 'The saved account database is temporarily unavailable. Please try again.' })
  })
}
