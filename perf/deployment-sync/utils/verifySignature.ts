import crypto from 'crypto'
import {VercelRequest} from '@vercel/node'
import {text} from 'micro'

function createSignature(secret: string, body: string) {
  return crypto.createHmac('sha1', secret).update(body).digest('hex')
}

export async function verifyVercelSignature(secret: string, req: VercelRequest) {
  return req.headers['x-vercel-signature'] === createSignature(secret, await text(req))
}

export async function verifyGithubSignature(secret: string, req: VercelRequest) {
  return req.headers['x-hub-signature'] === `sha1=${createSignature(secret, await text(req))}`
}
