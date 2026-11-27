import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {brotliCompressSync, constants, gzipSync} from 'node:zlib'

export interface JsSize {
  brotli: number
  files: number
  gzip: number
  raw: number
}

const JS_FILE = /\.m?js$/

async function listJsFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, {recursive: true, withFileTypes: true})
  return entries
    .filter((entry) => entry.isFile() && JS_FILE.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
}

/** Raw, gzip (level 9) and brotli (quality 11) size of the given files. */
export async function measureFiles(files: string[]): Promise<JsSize> {
  const size: JsSize = {brotli: 0, files: files.length, gzip: 0, raw: 0}
  const contents = await Promise.all(files.map((file) => readFile(file)))
  for (const content of contents) {
    size.raw += content.length
    size.gzip += gzipSync(content, {level: 9}).length
    size.brotli += brotliCompressSync(content, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_SIZE_HINT]: content.length,
      },
    }).length
  }
  return size
}

/** Every JS file the production build emitted. */
export async function measureBuild(distDir: string): Promise<JsSize> {
  return measureFiles(await listJsFiles(distDir))
}

/** The JS files that the given request paths (e.g. `/static/app-abc.js`) resolve to in `distDir`. */
export async function measureRequested(distDir: string, requestPaths: string[]): Promise<JsSize> {
  const unique = [...new Set(requestPaths)]
  return measureFiles(unique.map((requestPath) => path.join(distDir, requestPath)))
}
