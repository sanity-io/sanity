import path from 'path'
import {build} from 'vite'
import {getViteConfig} from './getViteConfig'

export interface ChunkModule {
  name: string
  originalLength: number
  renderedLength: number
}
export interface ChunkStats {
  name: string
  modules: ChunkModule[]
}
export interface StaticBuildOptions {
  cwd: string
  basePath: string
  outputDir: string
  minify?: boolean
  profile?: boolean
  sourceMap?: boolean
}

export async function buildStaticFiles(
  options: StaticBuildOptions
): Promise<{chunks: ChunkStats[]}> {
  const {cwd, outputDir, sourceMap = false, minify = true, basePath} = options

  const viteConfig = await getViteConfig({
    cwd,
    basePath,
    outputDir,
    minify,
    sourceMap,
    mode: 'production',
  })

  const bundle = await build(viteConfig)

  // @todo copy files

  // For typescript only - this shouldn't ever be the case given we're not watching
  if (Array.isArray(bundle) || !('output' in bundle)) {
    return {chunks: []}
  }

  const stats: ChunkStats[] = []
  bundle.output.forEach((chunk) => {
    if (chunk.type !== 'chunk') {
      return
    }

    stats.push({
      name: chunk.name,
      modules: Object.entries(chunk.modules).map(([rawFilePath, chunkModule]) => {
        const filePath = rawFilePath.startsWith('\x00')
          ? rawFilePath.slice('\x00'.length)
          : rawFilePath

        return {
          name: path.isAbsolute(filePath) ? path.relative(cwd, filePath) : filePath,
          originalLength: chunkModule.originalLength,
          renderedLength: chunkModule.renderedLength,
        }
      }),
    })
  })

  return {chunks: stats}
}
