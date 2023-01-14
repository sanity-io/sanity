import type {ChunkMetadata, Plugin} from 'vite'
import type {SanityMonorepo} from '../sanityMonorepo'
import {renderDocument} from '../renderDocument'

interface ViteOutputBundle {
  [fileName: string]: ViteRenderedChunk | ViteRenderedAsset
}

interface ViteRenderedAsset {
  type: 'asset'
}

interface ViteRenderedChunk {
  type: 'chunk'
  name: string
  fileName: string
  facadeModuleId: string | null
  code: string
  imports: string[]
  viteMetadata: ChunkMetadata
}

const entryChunkId = '.sanity/runtime/app.js'

export function sanityBuildEntries(options: {
  cwd: string
  monorepo: SanityMonorepo | undefined
  basePath: string
}): Plugin {
  const {cwd, monorepo, basePath} = options

  return {
    name: 'sanity/server/build-entries',
    apply: 'build',

    buildStart() {
      this.emitFile({
        type: 'chunk',
        id: entryChunkId,
        name: 'sanity',
      })
    },

    async generateBundle(_options, outputBundle) {
      const bundle = outputBundle as unknown as ViteOutputBundle
      const entryFile = Object.values(bundle).find(
        (file) =>
          file.type === 'chunk' &&
          file.name === 'sanity' &&
          file.facadeModuleId?.endsWith(entryChunkId)
      )

      if (!entryFile) {
        throw new Error(`Failed to find entry file in bundle (${entryChunkId})`)
      }

      if (entryFile.type !== 'chunk') {
        throw new Error('Entry file is not a chunk')
      }

      const entryFileName = entryFile.fileName
      const entryPath = [basePath.replace(/\/+$/, ''), entryFileName].join('/')

      let css: string[] = []
      if (entryFile.viteMetadata?.importedCss) {
        // Check all the top-level imports of the entryPoint to see if they have
        // static CSS assets that need loading
        css = [...entryFile.viteMetadata.importedCss]
        for (const key of entryFile.imports) {
          // Traverse all CSS assets that isn't loaded by the runtime and
          // need <link> tags in the HTML template
          const entry = bundle[key]
          const importedCss =
            entry && entry.type === 'chunk' ? entry.viteMetadata.importedCss : undefined

          if (importedCss) {
            css.push(...importedCss)
          }
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: await renderDocument({
          monorepo,
          studioRootPath: cwd,
          props: {
            basePath,
            entryPath,
            css,
          },
        }),
      })
    },
  }
}
