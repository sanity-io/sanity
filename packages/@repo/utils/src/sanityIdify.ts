import {deburr} from 'lodash'

export function sanityIdify(input: string): string {
  return deburr(input)
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^-/, '')
}
