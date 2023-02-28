import crypto from 'crypto'
import {VercelRequest} from '@vercel/node'
import {text} from 'micro'

export async function verifySignature(secret: string, req: VercelRequest) {
  const payload = await text(req)
  const signature = crypto.createHmac('sha1', secret).update(payload).digest('hex')
  return signature === req.headers['x-vercel-signature']
}
