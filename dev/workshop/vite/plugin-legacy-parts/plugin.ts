import path from 'path'
import resolve from 'resolve'

const ROOT_PATH = path.resolve(__dirname, '../../../..')
const DEBUG_PART_PATH = path.resolve(__dirname, 'parts/debug.ts')
const EMPTY_PART_PATH = path.resolve(__dirname, 'parts/empty.ts')

// NOTE: this plugin is not a complete implementation of the PARTS system (but it could be)
export function pluginLegacyParts(partsResolver: any) {
  return {
    name: 'workshop-scopes',

    async resolveId(id: string) {
      if (id === 'config:sanity') {
        return path.resolve(__dirname, '../../sanity.json')
      }

      if (
        id.startsWith('part:') ||
        id.startsWith('config:') ||
        id.startsWith('sanity:') ||
        id.startsWith('all:part:')
      ) {
        const parts = await partsResolver.load()
        const implementations = parts.implementations[id]

        if (implementations && implementations.length > 0) {
          let partPath = resolve.sync(implementations[0].path, {
            extensions: ['.ts', '.tsx', '.js'],
          })

          // NOTE: this is a workaround since Vite doesn't do CJS exports
          if (id === 'part:@sanity/base/client') {
            partPath = partPath.replace('/index.ts', '/index.esm.ts')
          }

          // eslint-disable-next-line no-console
          console.log(id, '=>', path.relative(ROOT_PATH, partPath))

          return partPath
        }

        if (id.endsWith('?')) {
          return EMPTY_PART_PATH
        }

        return DEBUG_PART_PATH
      }

      if (id.startsWith('sanity:')) {
        return DEBUG_PART_PATH
      }

      return undefined
    },
  }
}
