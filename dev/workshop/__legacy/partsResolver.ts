import path from 'path'
import {resolveParts} from '@sanity/resolver'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Parts = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Plugin = any

export interface PartsResolver {
  load: () => Promise<Parts>
}

export function createPartsResolver(): PartsResolver {
  const basePath = path.resolve(__dirname, '..')
  const env = 'development'
  const additionalPlugins: Plugin[] = []
  const isSanityMonorepo = true

  let cache: Parts | null = null

  // eslint-disable-next-line require-await
  async function load() {
    if (cache) return Promise.resolve(cache)

    return resolveParts({env, basePath, additionalPlugins, isSanityMonorepo}).then(
      (parts: Parts) => {
        cache = parts
        return parts
      }
    )
  }

  load()

  return {load}
}
