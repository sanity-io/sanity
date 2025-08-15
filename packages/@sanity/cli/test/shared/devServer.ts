import {spawn} from 'node:child_process'
import {createHash} from 'node:crypto'

import {cliBinPath, sanityEnv} from './environment'
import {request, type ResponseData} from './request'

export async function testServerCommand({
  command,
  port,
  cwd,
  env,
  basePath,
  expectedOutput,
  serverTimeout = 40_000,
  outputTimeout = 50_000,
  expectedTitle,
  expectedFiles = [],
  args,
}: {
  command: 'preview' | 'dev' | 'start'
  port: number
  cwd: string
  basePath: string
  expectedTitle: string
  expectedFiles?: string[]
  serverTimeout?: number
  outputTimeout?: number
  expectedOutput?: ({stdout, stderr}: {stdout: string; stderr: string}) => void
  env?: Record<string, string>
  args?: string[]
}): Promise<{
  html: string
  fileHashes: Map<string, string | null>
  stdout: string
  stderr: string
}> {
  const connect = await request(`http://localhost:${port}/`).catch(() => null)
  if (connect !== null && 'statusCode' in connect) {
    throw new Error(`Something is already listening on :${port}`)
  }

  const startedAt = Date.now()

  const proc = spawn(process.argv[0], [cliBinPath, command, ...(args || [])], {
    cwd,
    env: {...sanityEnv, ...env},
    stdio: 'pipe',
  })

  const stderr: Buffer[] = []
  const stdout: Buffer[] = []

  const cmdResult = new Promise<{code: number | null; stdout: string; stderr: string}>(
    (resolve, reject) => {
      proc.stderr.on('data', (chunk) => {
        stderr.push(chunk)
        check(null)
      })

      proc.stdout.on('data', (chunk) => {
        stdout.push(chunk)
        check(null)
      })

      proc.once('close', (code) => check(code))

      function check(code: number | null) {
        const stderrStr = buffersToString(stderr)
        const stdoutStr = buffersToString(stdout)
        if (code && code > 0) {
          reject(
            new Error(`'sanity ${command}' failed with code ${code}:\n${stderrStr}\n${stdoutStr}`),
          )
          return
        }

        try {
          expectedOutput?.({stderr: buffersToString(stderr), stdout: buffersToString(stdout)})
          resolve({code, stderr: stderrStr, stdout: stdoutStr})
        } catch (error) {
          if (error.name !== 'AssertionError') {
            throw error
          }
          if (Date.now() - startedAt > serverTimeout) {
            // assertion keeps failing for too long
            reject(error)
          } else {
            setTimeout(check, 1000)
          }
        }
      }
    },
  )

  const serverResult = new Promise<{html: string; fileHashes: Map<string, string | null>}>(
    (resolve, reject) => {
      setTimeout(tryConnect, 1000)

      async function tryConnect() {
        let res: ResponseData
        try {
          res = await Promise.race([
            request(`http://localhost:${port}${basePath.replace(/\/$/, '')}/`),
            new Promise<never>((_, rejectTimeout) =>
              setTimeout(rejectTimeout, 500, new Error('Timed out trying to connect')),
            ),
          ])
        } catch (err) {
          if (Date.now() - startedAt > outputTimeout) {
            reject(new Error('Timed out waiting for server to get online'))
            return
          }
          setTimeout(tryConnect, 1000)
          return
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP server responded with HTTP ${res.statusCode}`))
          return
        }

        const fileHashes = new Map<string, string | null>()
        for (const file of expectedFiles) {
          fileHashes.set(
            file,
            await request(`http://localhost:${port}${file}`)
              .then(({body, statusCode}) =>
                statusCode === 200 ? createHash('sha256').update(body).digest('hex') : null,
              )
              .catch(() => null),
          )
        }
        resolve({fileHashes, html: res.body.toString('utf8')})
      }
    },
  ).then((serverRes) => {
    if (!serverRes.html.includes(`<title>${expectedTitle}`)) {
      throw new Error(`Did not find expected <title> in HTML:\n\n${serverRes.html}`)
    }
    if (!expectedOutput) {
      proc.kill()
    }
    return serverRes
  })

  return serverResult.then((serverRes) => {
    return cmdResult
      .then((cmdRes) => ({
        ...serverRes,
        ...cmdRes,
      }))
      .finally(() => proc.kill())
  })
}

function buffersToString(buffers: Buffer[]): string {
  return Buffer.concat(buffers).toString('utf8')
}
