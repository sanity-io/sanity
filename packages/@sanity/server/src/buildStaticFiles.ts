import path from 'path'
import viteReact from '@vitejs/plugin-react'
import {build} from 'vite'
import {getAliases} from './getAliases'

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
  outDir: string
  minify?: boolean
  profile?: boolean
  sourceMap?: boolean
}

export async function buildStaticFiles(
  options: StaticBuildOptions
): Promise<{chunks: ChunkStats[]}> {
  const {cwd, outDir, profile, sourceMap = false, minify = true} = options

  const bundle = await build({
    build: {
      outDir,
      assetsDir: 'static',
      sourcemap: sourceMap,
      minify: minify ? 'esbuild' : false,
      emptyOutDir: false, // Rely on CLI to do this
      rollupOptions: {
        perf: profile,
        input: {
          main: path.resolve(__dirname, '../src/app/index.html'),
        },
      },
    },
    configFile: false,
    logLevel: 'silent',
    mode: 'production',
    plugins: [viteReact()],
    resolve: {alias: await getAliases(cwd)},
    root: path.resolve(__dirname, '../src/app'),
  })

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
