import {camelCase} from 'lodash'
import getSlug from 'speakingurl'
import {disallowedPattern} from './validateId'

export function getStructureNodeId(title: string, id?: string): string {
  if (id) {
    return id
  }

  const camelCased = camelCase(title)

  return disallowedPattern.test(camelCased) ? camelCase(getSlug(title)) : camelCased
}
