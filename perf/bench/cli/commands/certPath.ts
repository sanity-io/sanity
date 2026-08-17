/**
 * `bench cert-path` — write the bench TLS certificate (certificate block
 * only, no private key) to `.certs/bench-cert.pem` and print its absolute
 * path. CI imports it into the NSS store (`certutil`) so Chromium-on-Linux
 * treats it as valid — the `--ignore-certificate-errors-spki-list` launch
 * flag that suffices locally is not reliably honored there, and a *bypassed*
 * (rather than valid) cert disables the browser HTTP cache, breaking
 * warm-load measurements.
 */
import fs from 'node:fs'
import path from 'node:path'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {command, constant} from '@optique/core/primitives'

import {getBenchTls} from '../../mock-api/tls'
import {BENCH_ROOT} from '../benchRoot'

export const certPathCommand = command('cert-path', object({action: constant('cert-path')}), {
  description: message`Write the bench TLS certificate (public part only) to .certs/ and print its path`,
})

export async function writeCertificateFile(): Promise<string> {
  const {cert} = await getBenchTls()
  const certificateBlock = cert.match(
    /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/,
  )?.[0]
  if (!certificateBlock) {
    throw new Error('No certificate block found in the bench TLS PEM')
  }

  const outPath = path.join(BENCH_ROOT, '.certs/bench-cert.pem')
  fs.mkdirSync(path.dirname(outPath), {recursive: true})
  fs.writeFileSync(outPath, `${certificateBlock}\n`)
  return outPath
}
