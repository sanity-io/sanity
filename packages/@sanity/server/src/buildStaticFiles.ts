import fs from 'fs/promises'
import path from 'path'
import {build, InlineConfig} from 'vite'
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

  vite?: (config: InlineConfig) => InlineConfig
}

export async function buildStaticFiles(
  options: StaticBuildOptions
): Promise<{chunks: ChunkStats[]}> {
  const {
    cwd,
    outputDir,
    sourceMap = false,
    minify = true,
    basePath,
    vite: extendViteConfig,
  } = options

  let viteConfig = await getViteConfig({
    cwd,
    basePath,
    outputDir,
    minify,
    sourceMap,
    mode: 'production',
  })

  if (extendViteConfig) {
    viteConfig = extendViteConfig(viteConfig)
  }

  const bundle = await build(viteConfig)

  // Copy files placed in /static to the built /static
  await copyDir(path.join(cwd, 'static'), path.join(outputDir, 'static'))

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

async function copyDir(srcDir: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, {recursive: true})

  for (const file of await tryReadDir(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    if (srcFile === destDir) {
      continue
    }

    const destFile = path.resolve(destDir, file)
    const stat = await fs.stat(srcFile)
    if (stat.isDirectory()) {
      await copyDir(srcFile, destFile)
    } else {
      await fs.copyFile(srcFile, destFile)
    }
  }
}

async function tryReadDir(dir: string): Promise<string[]> {
  try {
    const content = await fs.readdir(dir)
    return content
  } catch (err) {
    if (err.code === 'ENOENT') {
      return []
    }

    throw err
  }
}
