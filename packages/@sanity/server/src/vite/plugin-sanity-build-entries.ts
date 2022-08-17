import type {ChunkMetadata, Plugin} from 'vite'
import type {SanityMonorepo} from '../sanityMonorepo'
import {renderDocument} from '../renderDocument'

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

  let entryChunkRef: string

  return {
    name: '@sanity/server/build-entries',
    apply: 'build',

    buildStart() {
      entryChunkRef = this.emitFile({
        type: 'chunk',
        id: '.sanity/runtime/app.js',
        name: 'sanity',
      })
    },

    async generateBundle(_options, outputBundle) {
      const bundle = outputBundle as unknown as ViteOutputBundle

      const entryFileName = this.getFileName(entryChunkRef)
      const entryFile = bundle[entryFileName]
      if (!entryFile) {
        throw new Error(`Failed to find entry file in bundle (${entryFileName})`)
      }

      const entryPath = [basePath.replace(/\/+$/, ''), entryFileName].join('/')

      let css: string[] = []
      if (entryFile.viteMetadata?.importedCss) {
        // Check all the top-level imports of the entryPoint to see if they have
        // static CSS assets that need loading
        css = [...entryFile.viteMetadata.importedCss]
        for (const key of entryFile.imports) {
          // Traverse all CSS assets that isn't loaded by the runtime and
          // need <link> tags in the HTML template
          css.push(...bundle[key].viteMetadata.importedCss)
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: await renderDocument({
          monorepo,
          studioRootPath: cwd,
          props: {
            entryPath,
            css,
          },
        }),
      })
    },
  }
}
