import * as fs from 'node:fs'
import path from 'node:path'
import {promisify} from 'node:util'
import * as zlib from 'node:zlib'

const gzip = promisify(zlib.gzip)

export interface BundleSizeReport {
  /** Gzipped bytes of the JS chunks referenced by index.html. */
  initialJsBytes: number
  /** Gzipped bytes of every JS chunk in the build. */
  totalJsBytes: number
  chunkCount: number
  /**
   * Gzipped bytes per chunk, keyed by served path ('/static/foo.js') — joined
   * with each boot-cold sample's fetched paths to compute the "boot JS" metric
   * (what booting actually downloads). Not part of the stored report: callers
   * strip it before persisting, it's ~400 entries of noise in a document.
   */
  sizesByPath: Map<string, number>
}

/**
 * Exact bundle-size measurement over a `sanity build` output: gzip totals
 * for the initial chunks (script tags + modulepreloads in index.html) and
 * for the full chunk set. Deterministic — gated on exact deltas, no
 * statistics needed.
 */
export async function measureBundleSize(distDir: string): Promise<BundleSizeReport> {
  const indexHtml = await fs.promises.readFile(path.join(distDir, 'index.html'), 'utf8')
  const initialPaths = new Set<string>()
  for (const match of indexHtml.matchAll(/(?:src|href)="(\/[^"]+\.m?js)"/g)) {
    initialPaths.add(match[1])
  }

  const staticDir = path.join(distDir, 'static')
  const chunkFiles = (await fs.promises.readdir(staticDir)).filter((file) => /\.m?js$/.test(file))

  let initialJsBytes = 0
  let totalJsBytes = 0
  const sizesByPath = new Map<string, number>()
  for (const file of chunkFiles) {
    const contents = await fs.promises.readFile(path.join(staticDir, file))
    const gzippedBytes = (await gzip(contents)).byteLength
    sizesByPath.set(`/static/${file}`, gzippedBytes)
    totalJsBytes += gzippedBytes
    if (initialPaths.has(`/static/${file}`)) {
      initialJsBytes += gzippedBytes
    }
  }

  return {initialJsBytes, totalJsBytes, chunkCount: chunkFiles.length, sizesByPath}
}
