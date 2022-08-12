import path from 'path'
import fs from 'fs/promises'
import {constants as fsConstants} from 'fs'
import {build, InlineConfig} from 'vite'
import {finalizeViteConfig, getViteConfig} from './getViteConfig'
import {generateWebManifest} from './webManifest'
import {writeSanityRuntime} from './runtime'

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

  await writeSanityRuntime({cwd, watch: false})

  let viteConfig = await getViteConfig({
    cwd,
    basePath,
    outputDir,
    minify,
    sourceMap,
    mode: 'production',
  })

  if (extendViteConfig) {
    viteConfig = finalizeViteConfig(extendViteConfig(viteConfig))
  }

  // Copy files placed in /static to the built /static
  const staticPath = path.join(outputDir, 'static')
  await copyDir(path.join(cwd, 'static'), staticPath)

  // Write favicons, not overwriting ones that already exist, to static folder
  const faviconBasePath = `${basePath.replace(/\/+$/, '')}/static`
  await writeFavicons(faviconBasePath, staticPath)

  const bundle = await build(viteConfig)

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

async function copyDir(srcDir: string, destDir: string, skipExisting?: boolean): Promise<void> {
  await fs.mkdir(destDir, {recursive: true})

  for (const file of await tryReadDir(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    if (srcFile === destDir) {
      continue
    }

    const destFile = path.resolve(destDir, file)
    const stat = await fs.stat(srcFile)

    if (stat.isDirectory()) {
      await copyDir(srcFile, destFile, skipExisting)
    } else if (skipExisting) {
      await fs.copyFile(srcFile, destFile, fsConstants.COPYFILE_EXCL).catch(skipIfExistsError)
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

function skipIfExistsError(err: Error & {code: string}) {
  if (err.code === 'EEXIST') {
    return
  }

  throw err
}

async function writeFavicons(basePath: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, {recursive: true})
  await copyDir(path.join(__dirname, 'static', 'favicons'), destDir, true)
  await writeWebManifest(basePath, destDir)
}

async function writeWebManifest(basePath: string, destDir: string): Promise<void> {
  const content = JSON.stringify(generateWebManifest(basePath), null, 2)
  await fs
    .writeFile(path.join(destDir, 'manifest.webmanifest'), content, 'utf8')
    .catch(skipIfExistsError)
}
