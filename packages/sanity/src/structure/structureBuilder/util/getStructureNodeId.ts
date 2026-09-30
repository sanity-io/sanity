import camelCase from 'lodash-es/camelCase.js'
import {validateStructureNodeId} from 'sanity'
import getSlug from 'speakingurl'

export function getStructureNodeId(title: string, id?: string): string {
  if (id) {
    return id
  }

  const camelCased = camelCase(title)

  return validateStructureNodeId(camelCased).isValid ? camelCased : camelCase(getSlug(title))
}
