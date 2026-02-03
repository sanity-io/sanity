import {disallowedPattern} from './validateId'
import {camelCase} from 'lodash-es'
import getSlug from 'speakingurl'

export function getStructureNodeId(title: string, id?: string): string {
  if (id) {
    return id
  }

  const camelCased = camelCase(title)

  return disallowedPattern.test(camelCased) ? camelCase(getSlug(title)) : camelCased
}
