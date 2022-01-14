import type {ConfigEnv, Plugin} from 'vite'
import resolveFrom from 'resolve-from'
import {getSanityStudioConfigPath} from '../sanityConfig'
import {renderDocument} from '../renderDocument'

const basePattern = /@sanity[/\\]base/
const entryPattern = /studioEntry\.(js|ts)x?$/
const entryModuleId = '$SANITY_STUDIO_ENTRY$'
const configModuleId = '$SANITY_STUDIO_CONFIG$'

export interface SanityStudioVitePluginOptions {
  cwd: string
  basePath: string
  isMonorepo: boolean
}

/**
 * Vite plugin providing importable aliases and generating `index.html` without
 * needing an index on-disk physically.
 *
 * Provided aliases:
 * - `$SANITY_STUDIO_CONFIG$` => `<studioRoot>/sanity.config.(js|ts)`
 * - `$SANITY_STUID_ENTRY$`   => `@sanity/base/studioEntry` (studio relative)
 *
 * Aside from being aliases, these are treated as any other source files,
 * giving the same affordances: watching, hot reloading, transpilation etc.
 *
 * HOWEVER, these modules are only available to import from the studio entry
 * module and index.html. We do not want users to import the config in their
 * plugins/custom code, but instead fetch the config from React context.
 *
 * Why, you might you ask?
 *
 * 1. It ensures Sanity plugins will continue to work outside the scope of the
 *    Sanity dev tooling. For instance, if rendered inside a Next.js app, the
 *    import would not work without providing additional aliases etc.
 *
 * 2. It lets us replace how the configuration is loaded/provided to the app
 *    without considering ecosystem implications.
 *
 * @internal
 */
export function viteSanityStudio({
  cwd,
  basePath,
  isMonorepo,
}: SanityStudioVitePluginOptions): Plugin {
  let runCommand: ConfigEnv['command']
  let entryChunkRef: string

  return {
    name: '@sanity/server/vite-sanity-studio',

    /**
     * We need to conditionally apply _parts_ of the plugin in different commands,
     * so we store the active command so we can reuse it during lifecycle methods
     */
    apply(_config, {command}) {
      runCommand = command
      return true
    },

    /**
     * Resolves aliases if the importer is "approved"
     */
    resolveId(source, importer = '') {
      // Only allow loading entry chunk from index.html
      if (source.endsWith(`/${entryModuleId}`) && importer.endsWith('/index.html')) {
        return resolveEntryModulePath({cwd, isMonorepo})
      }

      if (
        source === configModuleId &&
        // Only allow resolving config module from entry
        basePattern.test(importer) &&
        entryPattern.test(importer)
      ) {
        return getSanityStudioConfigPath(cwd)
      }

      return null
    },

    /**
     * Generates an entry chunk we can reference in order to get the file path
     * for the built `index.html`
     */
    buildStart() {
      if (runCommand !== 'build') {
        return
      }

      entryChunkRef = this.emitFile({
        type: 'chunk',
        id: resolveEntryModulePath({cwd, isMonorepo}),
        name: 'studioEntry',
      })
    },

    /**
     * Generates a `index.html` file dynamically, referencing the entry chunk
     */
    async generateBundle() {
      if (runCommand !== 'build') {
        return
      }

      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: await renderDocument({
          isMonorepo,
          studioRootPath: cwd,
          props: {entryPath: `${basePath}${this.getFileName(entryChunkRef)}`},
        }),
      })
    },
  }
}

/**
 * Resolves the location of the studio entry module, relative to the studio root
 *
 * @internal
 */
export function resolveEntryModulePath(opts: {cwd: string; isMonorepo: boolean}): string {
  if (opts.isMonorepo) {
    return resolveFrom(opts.cwd, '@sanity/base/src/_exports/studioEntry')
  }

  return resolveFrom(opts.cwd, '@sanity/base/studioEntry')
}
