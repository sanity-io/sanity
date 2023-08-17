import {spawn} from 'child_process'
import {createHash} from 'crypto'
import {cliBinPath, sanityEnv} from './environment'
import {request, ResponseData} from './request'

export function testServerCommand({
  command,
  port,
  cwd,
  env,
  expectedTitle,
  expectedFiles = [],
  args,
}: {
  command: 'preview' | 'dev' | 'start'
  port: number
  cwd: string
  expectedTitle: string
  expectedFiles?: string[]
  env?: Record<string, string>
  args?: string[]
}): Promise<{
  html: string
  fileHashes: Map<string, string | null>
  stdout: string
  stderr: string
}> {
  return new Promise(async (resolve, reject) => {
    const maxWaitForServer = 120000
    const startedAt = Date.now()
    let hasSucceeded = false
    let timer: ReturnType<typeof setTimeout>

    const connect = await request(`http://localhost:${port}/`).catch((err) => err as Error)
    if ('statusCode' in connect) {
      reject(new Error(`Something is already listening on :${port}`))
      return
    }

    const proc = spawn(process.argv[0], [cliBinPath, command, ...(args || [])], {
      cwd,
      env: {...sanityEnv, ...env},
      stdio: 'pipe',
    })

    const stderr: Buffer[] = []
    const stdout: Buffer[] = []
    proc.stderr.on('data', (chunk) => stderr.push(chunk))
    proc.stdout.on('data', (chunk) => stdout.push(chunk))

    proc.on('close', (code) => {
      if (!hasSucceeded && code && code > 0) {
        const stderrStr = buffersToString(stderr)
        const stdoutStr = buffersToString(stdout)
        reject(
          new Error(`'sanity ${command}' failed with code ${code}:\n${stderrStr}\n${stdoutStr}`),
        )
      }
    })

    scheduleConnect()

    function scheduleConnect() {
      if (timer) {
        clearTimeout(timer)
      }

      if (Date.now() - startedAt > maxWaitForServer) {
        reject(new Error('Timed out waiting for server to get online'))
        return
      }

      timer = setTimeout(tryConnect, 1000)
    }

    async function tryConnect() {
      let res: ResponseData
      try {
        res = await Promise.race([
          request(`http://localhost:${port}/`),
          new Promise<ResponseData>((_, rejectTimeout) =>
            setTimeout(rejectTimeout, 500, new Error('Timed out trying to connect')),
          ),
        ])
      } catch (err) {
        scheduleConnect()
        return
      }

      if (res.statusCode !== 200) {
        proc.kill()
        reject(new Error(`HTTP server responded with HTTP ${res.statusCode}`))
        return
      }

      const fileHashes = new Map<string, string | null>()
      for (const file of expectedFiles) {
        fileHashes.set(
          file,
          await request(`http://localhost:${port}/${file}`)
            .then(({body, statusCode}) =>
              statusCode === 200 ? createHash('sha256').update(body).digest('hex') : null,
            )
            .catch(() => null),
        )
      }

      const html = res.body.toString('utf8')
      if (html.includes(`<title>${expectedTitle}`)) {
        onSuccess(html, fileHashes)
        return
      }

      proc.kill()
      reject(new Error(`Did not find expected <title> in HTML:\n\n${html}`))
    }

    function onSuccess(html: string, fileHashes: Map<string, string | null>) {
      hasSucceeded = true
      clearTimeout(timer)
      proc.kill()
      resolve({
        html,
        fileHashes,
        stdout: buffersToString(stdout),
        stderr: buffersToString(stderr),
      })
    }
  })
}

function buffersToString(buffers: Buffer[]): string {
  return Buffer.concat(buffers).toString('utf8')
}
