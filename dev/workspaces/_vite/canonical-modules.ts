import type {Plugin} from 'vite'
import {getModulePath} from './helpers'

export function viteCanonicalModules(opts: {ids: string[]; cwd: string}): Plugin {
  return {
    name: 'sanity-workspaces/vite-canonical-modules',

    resolveId(id: string) {
      if (opts.ids.includes(id)) {
        return getModulePath(id, opts.cwd)
      }

      return undefined
    },
  }
}
