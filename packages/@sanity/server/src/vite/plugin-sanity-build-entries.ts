import type {Plugin} from 'vite'
import {getEntryModule} from '../getEntryModule'
import {renderDocument} from '../renderDocument'
import {getSanityStudioConfigPath} from '../sanityConfig'
import type {SanityMonorepo} from '../sanityMonorepo'

export const virtualEntryModuleId = '@sanity-studio-entry'

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

    async generateBundle(_options, bundle) {
      const entryFileName = this.getFileName(entryChunkRef)
      const entryFile = bundle[entryFileName] as unknown as {
        // TODO: figure out how to get the Vite typings for viteMetadata and imports
        imports: string[]
        viteMetadata: {importedCss: Set<string>}
      }
      const css = [...entryFile.viteMetadata.importedCss]
      // Check all the top-level imports of the entryPoint to see if they have static CSS assets that need loading
      for (const key of entryFile.imports) {
        // Traverse all CSS assets that isn't loaded by the runtime and need <link> tags in the HTML template
        css.push(
          ...(bundle[key] as unknown as {viteMetadata: {importedCss: Set<string>}}).viteMetadata
            .importedCss
        )
      }

      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: await renderDocument({
          monorepo,
          studioRootPath: cwd,
          props: {
            entryPath: `${basePath}${this.getFileName(entryChunkRef)}`,
            css,
          },
        }),
      })
    },
  }
}
