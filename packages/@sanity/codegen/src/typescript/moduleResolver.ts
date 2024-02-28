import {readFile, stat} from 'node:fs/promises'
import path from 'node:path'

export async function getResolver(): Promise<NodeJS.RequireResolve> {
  // find tsconfig.json
  let resolveMap: Record<string, string[]> = {}
  const cwd = process.cwd()
  const tsconfigPath = path.join(cwd, 'tsconfig.json')
  const tsconfigFile = await stat(tsconfigPath).catch((err) => {
    if (err.code === 'ENOENT') {
      return null
    }
    throw err
  })

  if (tsconfigFile) {
    const tsconfigContent = await readFile(tsconfigPath)
    try {
      const tsconfigConfig = JSON.parse(tsconfigContent.toString())
      if ('compilerOptions' in tsconfigConfig && 'paths' in tsconfigConfig.compilerOptions) {
        resolveMap = tsconfigConfig.compilerOptions.paths as Record<string, string[]>
      }
    } catch (error) {
      // ignore errors for now..
    }
  }

  const resolve = function (request: string, options?: {paths?: string[]}): string {
    // Check if tsconfig has path overrides for this request
    for (const entry of Object.entries(resolveMap)) {
      let key = entry[0]
      const values = entry[1]

      for (let value of values) {
        if (key.endsWith('/*') && value.endsWith('/*')) {
          key = key.slice(0, -1)
          value = value.slice(0, -1)

          const index = request.indexOf(key)
          if (index === -1) {
            continue
          }
          const newRequest = path.join(cwd, value, request.slice(index + key.length))

          return require.resolve(newRequest, options)
        }
      }
    }

    return require.resolve(request, options)
  }

  resolve.paths = (request: string): string[] | null => {
    return require.resolve.paths(request)
  }
  return resolve
}
