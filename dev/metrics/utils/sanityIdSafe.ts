import {deburr} from 'lodash'

export function sanityIdify(prefix: string, input: string) {
  return prefix + deburr(input).replace(/[^a-zA-Z0-9._-]/, '_')
}
