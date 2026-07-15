import {createHash, X509Certificate} from 'node:crypto'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {getCertificate} from '@vitejs/plugin-basic-ssl'

import {EXPERIMENT, REFERENCE} from '../constants'

const CERT_CACHE_DIR = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  '.certs',
)

/**
 * A single self-signed certificate covering every hostname the suite uses.
 * HTTP/2 (which browsers only speak over TLS) is required — over plain h1 the
 * browser's 6-connections-per-host limit starves the studio's concurrent SSE
 * listeners (pair, global preview, releases, list queries) and the UI never
 * settles. Playwright contexts run with `ignoreHTTPSErrors: true`; for manual
 * `bench:dev` in a regular browser, accept the interstitial once.
 */
export async function getBenchTls(): Promise<{key: string; cert: string; spki: string}> {
  const pem = await getCertificate(CERT_CACHE_DIR, 'sanity-bench', [
    'localhost',
    `${EXPERIMENT.projectId}.localhost`,
    `${REFERENCE.projectId}.localhost`,
  ])
  return {key: pem, cert: pem, spki: spkiFingerprint(pem)}
}

/**
 * base64(sha256(SubjectPublicKeyInfo)) for Chromium's
 * `--ignore-certificate-errors-spki-list`. With the allowlist flag the cert
 * counts as *valid* — unlike Playwright's blanket `ignoreHTTPSErrors`, which
 * bypasses the error but leaves Chromium refusing to HTTP-cache anything
 * from the "broken" origin (breaking warm-load measurements).
 */
function spkiFingerprint(pem: string): string {
  const spkiDer = new X509Certificate(pem).publicKey.export({type: 'spki', format: 'der'})
  return createHash('sha256').update(spkiDer).digest('base64')
}
