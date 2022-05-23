import {createHash} from 'node:crypto'
import type {ChunkMetadata, Plugin} from 'vite'
import {getEntryModule} from '../getEntryModule'
import {renderDocument} from '../renderDocument'
import {getSanityStudioConfigPath} from '../sanityConfig'
import type {SanityMonorepo} from '../sanityMonorepo'

export const virtualEntryModuleId = '@sanity-studio-entry'
interface ViteOutputBundle {
  [fileName: string]: ViteRenderedChunk
}

interface ViteRenderedChunk {
  code: string
  imports: string[]
  viteMetadata: ChunkMetadata
}

export function sanityBuildEntries(options: {
  cwd: string
  monorepo: SanityMonorepo | undefined
  basePath: string
}): Plugin {
  const {cwd, monorepo, basePath} = options
  const resolvedVirtualModuleId = `\0${virtualEntryModuleId}`

  let entryChunkRef: string

  return {
    name: '@sanity/server/sanity-index-html',
    apply: 'build',

    resolveId(id) {
      return id === virtualEntryModuleId ? resolvedVirtualModuleId : undefined
    },

    load(id) {
      if (id !== resolvedVirtualModuleId) {
        return undefined
      }

      return getSanityStudioConfigPath(cwd).then((configPath) =>
        getEntryModule({relativeConfigLocation: configPath || './sanity.config'})
      )
    },

    buildStart() {
      entryChunkRef = this.emitFile({
        type: 'chunk',
        id: virtualEntryModuleId,
        name: 'studioEntry',
        fileName: 'studioEntry.js',
      })
    },

    async generateBundle(_options, outputBundle) {
      const bundle = outputBundle as unknown as ViteOutputBundle

      const entryFileName = this.getFileName(entryChunkRef)
      const entryFile = bundle[entryFileName]
      const entryHash = createHash('sha256').update(entryFile.code).digest('hex').slice(0, 8)

      // Check all the top-level imports of the entryPoint to see if they have
      // static CSS assets that need loading
      const css = [...entryFile.viteMetadata.importedCss]
      for (const key of entryFile.imports) {
        // Traverse all CSS assets that isn't loaded by the runtime and
        // need <link> tags in the HTML template
        css.push(...bundle[key].viteMetadata.importedCss)
      }

      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: await renderDocument({
          monorepo,
          studioRootPath: cwd,
          props: {
            entryPath: `${basePath}${this.getFileName(entryChunkRef)}?v=${entryHash}`,
            css,
          },
        }),
      })
    },
  }
}
