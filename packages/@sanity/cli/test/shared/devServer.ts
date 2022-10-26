import {spawn} from 'child_process'
import {cliBinPath, sanityEnv} from './environment'
import {request, ResponseData} from './request'

export function testServerCommand({
  command,
  port,
  cwd,
  expectedTitle,
  args,
}: {
  command: 'preview' | 'dev' | 'start'
  port: number
  cwd: string
  expectedTitle: string
  args?: string[]
}): Promise<string> {
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
      env: sanityEnv,
      stdio: 'pipe',
    })

    const stderr: Buffer[] = []
    const stdout: Buffer[] = []
    proc.stderr.on('data', (chunk) => stderr.push(chunk))
    proc.stdout.on('data', (chunk) => stdout.push(chunk))

    proc.on('close', (code) => {
      if (!hasSucceeded && code && code > 0) {
        const stderrStr = Buffer.concat(stderr).toString('utf8')
        const stdoutStr = Buffer.concat(stdout).toString('utf8')
        reject(
          new Error(`'sanity ${command}' failed with code ${code}:\n${stderrStr}\n${stdoutStr}`)
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
            setTimeout(rejectTimeout, 500, new Error('Timed out trying to connect'))
          ),
        ])
      } catch (err) {
        scheduleConnect()
        return
      }

      if (res.statusCode !== 200) {
        proc.kill()
        reject(new Error(`Dev server responded with HTTP ${res.statusCode}`))
        return
      }

      const html = res.body.toString('utf8')
      if (html.includes(`<title>${expectedTitle}`)) {
        onSuccess(html)
        return
      }

      proc.kill()
      reject(new Error(`Did not find expected <title> in HTML:\n\n${html}`))
    }

    function onSuccess(html: string) {
      hasSucceeded = true
      clearTimeout(timer)
      proc.kill()
      resolve(html)
    }
  })
}
