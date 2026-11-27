import {createHash, X509Certificate} from 'node:crypto'

import {getCertificate} from '@vitejs/plugin-basic-ssl'

/**
 * The project's CORS list admits `https://<one label>.sanity.dev` on the default port, which is the
 * only secure origin a local server can stand in for.
 */
export const STUDIO_HOST = 'version-compare.sanity.dev'

export interface StudioTls {
  cert: string
  key: string
  /** base64(sha256(SubjectPublicKeyInfo)), for Chromium's `--ignore-certificate-errors-spki-list`. */
  spki: string
}

/**
 * A self-signed certificate for `STUDIO_HOST`. Chromium trusts it by public key, which makes it
 * count as valid, unlike `ignoreHTTPSErrors`, which bypasses the error and stops the browser from
 * HTTP caching anything from the origin.
 */
export async function getStudioTls(certDir: string): Promise<StudioTls> {
  const pem = await getCertificate(certDir, 'version-compare', [STUDIO_HOST])
  const spki = new X509Certificate(pem).publicKey.export({format: 'der', type: 'spki'})
  return {cert: pem, key: pem, spki: createHash('sha256').update(spki).digest('base64')}
}
