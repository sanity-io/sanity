import {createReadStream} from 'node:fs'
import {readFile, stat} from 'node:fs/promises'
import {createServer} from 'node:http'
import path from 'node:path'
import process from 'node:process'
import {gzipSync} from 'node:zlib'

import {chromium, type Page} from 'playwright'

type StartupState = 'no-tools' | 'signed-out'

interface ChunkMeasurement {
  gzipBytes: number
  path: string
  rawBytes: number
}

interface StartupMeasurement {
  chunkCount: number
  chunks: ChunkMeasurement[]
  gzipBytes: number
  rawBytes: number
  state: StartupState
}

const distDir = path.resolve(process.argv[2] ?? 'dev/auth-test-studio/dist')
const port = Number(process.env.SANITY_STARTUP_MEASURE_PORT ?? 3333)
const origin = `http://localhost:${port}`
const workspacePath = '/ppsg7ml5/noTools'
const server = createStaticServer(distDir)

await new Promise<void>((resolve, reject) => {
  server.once('error', reject)
  server.listen(port, resolve)
})

try {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? '/usr/bin/google-chrome',
    headless: true,
  })

  try {
    const signedOut = await measureState(await browser.newPage(), 'signed-out')
    const token = process.env.STUDIO_AUTH_TOKEN
    if (!token) {
      throw new Error('STUDIO_AUTH_TOKEN is required to measure the no-tools state')
    }
    const noTools = await measureState(await browser.newPage(), 'no-tools', token)
    process.stdout.write(
      `${JSON.stringify({distDir, measurements: [signedOut, noTools]}, null, 2)}\n`,
    )
  } finally {
    await browser.close()
  }
} finally {
  server.close()
}

async function measureState(
  page: Page,
  state: StartupState,
  token?: string,
): Promise<StartupMeasurement> {
  const hash = token ? `#token=${encodeURIComponent(token)}` : ''
  await page.goto(`${origin}${workspacePath}${hash}`, {waitUntil: 'domcontentloaded'})

  if (state === 'signed-out') {
    await page.getByText('Choose login provider').waitFor()
  } else {
    await page.getByRole('heading', {name: 'No configured tools'}).waitFor()
  }

  await page.waitForTimeout(1_000)
  const chunkPaths = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => new URL(entry.name))
      .filter((url) => url.origin === window.location.origin && /\.m?js$/.test(url.pathname))
      .map((url) => url.pathname)
      .toSorted(),
  )
  const chunks = await Promise.all(
    [...new Set(chunkPaths)].map(async (chunkPath): Promise<ChunkMeasurement> => {
      const contents = await readFile(path.join(distDir, chunkPath))
      return {
        gzipBytes: gzipSync(contents).byteLength,
        path: chunkPath,
        rawBytes: contents.byteLength,
      }
    }),
  )

  return {
    chunkCount: chunks.length,
    chunks,
    gzipBytes: chunks.reduce((total, chunk) => total + chunk.gzipBytes, 0),
    rawBytes: chunks.reduce((total, chunk) => total + chunk.rawBytes, 0),
    state,
  }
}

function createStaticServer(rootDir: string) {
  return createServer(async (request, response) => {
    const requestPath = new URL(request.url ?? '/', origin).pathname
    const candidatePath = path.join(rootDir, requestPath)
    const filePath = (await isFile(candidatePath))
      ? candidatePath
      : path.join(rootDir, 'index.html')
    const extension = path.extname(filePath)
    response.setHeader('Content-Type', contentType(extension))
    createReadStream(filePath).pipe(response)
  })
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

function contentType(extension: string): string {
  switch (extension) {
    case '.css':
      return 'text/css'
    case '.html':
      return 'text/html'
    case '.js':
    case '.mjs':
      return 'text/javascript'
    case '.json':
      return 'application/json'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}
