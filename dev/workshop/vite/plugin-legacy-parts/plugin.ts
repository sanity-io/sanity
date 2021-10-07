import path from 'path'
import resolve from 'resolve'
import chalk from 'chalk'
import {PluginOption} from 'vite'

const ROOT_PATH = path.resolve(__dirname, '../../../..')
const DEBUG_PART_PATH = path.resolve(__dirname, 'parts/debug.ts')
const EMPTY_PART_PATH = path.resolve(__dirname, 'parts/empty.ts')
const DEBUG_MANY_PATH = path.resolve(__dirname, 'parts/many.ts')
const RE_CSS_IMPORT_PART = /@import (?:'|")(part:.*)(?:'|");/gm

function isDeprecated(partName: string, source?: string) {
  if (source && (source.includes('/__legacy') || source.includes('/legacyPart'))) {
    return false
  }

  return (
    partName.startsWith('part:@sanity/components/') ||
    partName.endsWith('-icon') ||
    partName.endsWith('-style')
  )
}

// NOTE: this plugin is not a complete implementation of the PARTS system (but it could be)
export function pluginLegacyParts(partsResolver: any): PluginOption {
  return {
    name: 'workshop-scopes',

    async resolveId(id, source) {
      if (id === 'config:sanity') {
        return path.resolve(__dirname, '../../sanity.json')
      }

      if (
        id.startsWith('part:') ||
        id.startsWith('config:') ||
        id.startsWith('sanity:') ||
        id.startsWith('all:part:')
      ) {
        const isMany = id.startsWith('all:')

        if (isMany) {
          // Remove `all:` prefix
          id = id.slice(4)
        }

        const parts = await partsResolver.load()
        const implementations = parts.implementations[id]

        if (implementations && implementations.length > 0) {
          const partPath = resolve.sync(implementations[0].path, {
            extensions: ['.ts', '.tsx', '.js'],
          })

          const msg = [
            `\n`,
            `================================================================================`,
            `PART:        ${id}`,
            `Resolves to: ${path.relative(ROOT_PATH, partPath)}`,
            source && `Imported by: ${path.relative(ROOT_PATH, source)}`,
            ``,
          ]
            .filter(Boolean)
            .join('\n')

          if (isDeprecated(id, source)) {
            // eslint-disable-next-line no-console
            console.log(chalk.red(msg))
          } else {
            // eslint-disable-next-line no-console
            // console.log(msg)
          }

          if (isMany) {
            console.log('@todo')
            return DEBUG_MANY_PATH
          }

          return partPath
        }

        if (isMany) {
          return DEBUG_MANY_PATH
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

    transform(src, id) {
      // if (id.startsWith('all:')) {
      //   console.log('transform `all:*`', id)
      //   return `export default []`
      // }

      if (!id.endsWith('.css')) return undefined

      // =============================================== //
      // This will strip `@import '...';` from CSS files //
      // =============================================== //

      const matches: RegExpExecArray[] = []
      let m: RegExpExecArray | null

      while ((m = RE_CSS_IMPORT_PART.exec(src))) {
        matches.push(m)
      }

      if (matches.length === 0) {
        return undefined
      }

      let result = src

      for (const match of matches) {
        while (result.indexOf(match[0]) > -1) {
          result = result.replace(match[0], '')
        }
      }

      return result
    },
  }
}
