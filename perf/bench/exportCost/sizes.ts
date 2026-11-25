import {brotliCompressSync, constants, gzipSync} from 'node:zlib'

import {transform} from 'esbuild'

import {type CdnBuild} from './cdnBuild'

export interface ByteSizes {
  raw: number
  minified: number
  gzip: number
  brotli: number
}

/**
 * Per-module code as it ships: the module's rendered (tree-shaken) code from its output chunk,
 * minified on its own. Rolldown minifies whole chunks, so the per-module sum differs slightly
 * from the chunk sizes. `calibration` is shipped chunk bytes divided by that per-module sum;
 * the report prints the inverse, minified sums as a percentage of what the build ships.
 */
export class ModuleSizes {
  readonly raw = new Map<string, string>()
  readonly minified = new Map<string, string>()
  calibration = 1

  static async fromBuild(cdn: CdnBuild): Promise<ModuleSizes> {
    const sizes = new ModuleSizes()
    const pending: Promise<unknown>[] = []
    let chunkBytes = 0
    for (const chunk of cdn.chunks) {
      chunkBytes += Buffer.byteLength(chunk.code)
      for (const [id, rendered] of Object.entries(chunk.modules)) {
        if (!rendered.code) continue
        const code = rendered.code
        sizes.raw.set(id, code)
        pending.push(
          transform(code, {minify: true, loader: 'js', legalComments: 'none', charset: 'utf8'})
            .then((result) => result.code)
            .catch(() => code)
            .then((minified) => sizes.minified.set(id, minified)),
        )
      }
    }
    await Promise.all(pending)
    let minifiedBytes = 0
    for (const code of sizes.minified.values()) minifiedBytes += Buffer.byteLength(code)
    sizes.calibration = minifiedBytes > 0 ? chunkBytes / minifiedBytes : 1
    return sizes
  }

  minifiedBytes(ids: Iterable<string>): number {
    let total = 0
    for (const id of ids) total += Buffer.byteLength(this.minified.get(id) ?? '')
    return total
  }

  /** Sizes of a set of modules shipped together, compressed as one stream. */
  measure(ids: Iterable<string>, options: {compress: boolean}): ByteSizes {
    const sorted = [...ids].toSorted()
    let raw = 0
    const minified: string[] = []
    for (const id of sorted) {
      raw += Buffer.byteLength(this.raw.get(id) ?? '')
      const code = this.minified.get(id)
      if (code) minified.push(code)
    }
    const joined = Buffer.from(minified.join('\n'))
    return {
      raw,
      minified: joined.length,
      gzip: options.compress && joined.length > 0 ? gzipSync(joined, {level: 6}).length : 0,
      brotli: options.compress && joined.length > 0 ? brotli(joined) : 0,
    }
  }
}

export function brotli(buffer: Buffer): number {
  return brotliCompressSync(buffer, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11,
      [constants.BROTLI_PARAM_SIZE_HINT]: buffer.length,
    },
  }).length
}

export function fileSizes(code: string | Buffer): ByteSizes {
  const buffer = typeof code === 'string' ? Buffer.from(code) : code
  return {
    raw: buffer.length,
    minified: buffer.length,
    gzip: gzipSync(buffer, {level: 6}).length,
    brotli: brotli(buffer),
  }
}
