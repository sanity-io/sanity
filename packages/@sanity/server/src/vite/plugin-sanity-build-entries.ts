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

    async generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: await renderDocument({
          monorepo,
          studioRootPath: cwd,
          props: {entryPath: `${basePath}${this.getFileName(entryChunkRef)}`},
        }),
      })
    },
  }
}
