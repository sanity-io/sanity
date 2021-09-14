import path from 'path'
import resolve from 'resolve'
import chalk from 'chalk'
import {PluginOption} from 'vite'

const ROOT_PATH = path.resolve(__dirname, '../../../..')
const DEBUG_PART_PATH = path.resolve(__dirname, 'parts/debug.ts')
const EMPTY_PART_PATH = path.resolve(__dirname, 'parts/empty.ts')

function isDeprecated(partName: string, source?: string) {
  if (source && source.includes('/packages/@sanity/base/src/__legacy/')) {
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
        const parts = await partsResolver.load()
        const implementations = parts.implementations[id]

        if (implementations && implementations.length > 0) {
          const partPath = resolve.sync(implementations[0].path, {
            extensions: ['.ts', '.tsx', '.js'],
          })

          const msg = [
            `PART:        ${id}`,
            `Resolves to: ${path.relative(ROOT_PATH, partPath)}`,
            source && `Imported by: ${path.relative(ROOT_PATH, source)}`,
          ]
            .filter(Boolean)
            .join('\n')

          if (isDeprecated(id, source)) {
            // eslint-disable-next-line no-console
            console.log(chalk.red(msg))
          } else {
            // eslint-disable-next-line no-console
            console.log(chalk.gray(msg))
          }

          // eslint-disable-next-line no-console
          console.log('')

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
