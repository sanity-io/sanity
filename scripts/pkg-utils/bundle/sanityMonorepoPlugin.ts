import {Plugin} from 'rollup'
import {EXPECTED_SOURCE_DEPS, STUDIO_PEER_DEPS} from './constants'

/**
 * Plugin that makes the bundler externalize provided module ids as well as parts
 *
 * @todo: Remove support for parts
 */
export const sanityMonorepoPlugin = (opts: {external: string[]}): Plugin => ({
  name: 'sanity-monorepo',
  resolveId(source) {
    if (source[0] === '.' || source[0] === '/') {
      return undefined // include source
    }

    if (EXPECTED_SOURCE_DEPS.includes(source)) {
      return undefined // include source
    }

    if (source.endsWith('.css')) {
      return {id: source, external: true}
    }

    if (source.endsWith('.css?raw')) {
      return {id: source, external: true}
    }

    if (source.startsWith('all:part:')) {
      return {id: source, external: true}
    }

    if (source.startsWith('config:')) {
      return {id: source, external: true}
    }

    if (source.startsWith('part:')) {
      return {id: source, external: true}
    }

    if (source.startsWith('sanity:')) {
      return {id: source, external: true}
    }

    if (source.startsWith('@sanity/')) {
      return {id: source, external: true}
    }

    for (const e of opts.external) {
      if (source.startsWith(`${e}/`)) {
        return {id: source, external: true}
      }
    }

    if (STUDIO_PEER_DEPS.includes(source)) {
      throw new Error(`packages must not bundle "${source}" (missing in devDependencies?)`)
    }

    return undefined
  },
})
