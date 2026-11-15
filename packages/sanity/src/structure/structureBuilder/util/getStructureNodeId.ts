import camelCase from 'lodash-es/camelCase.js'
import getSlug from 'speakingurl'

import {validateStructureNodeId} from '../../../core/util/validateStructureNodeId'

export function getStructureNodeId(title: string, id?: string): string {
  if (id) {
    return id
  }

  const camelCased = camelCase(title)

  return validateStructureNodeId(camelCased).isValid ? camelCased : camelCase(getSlug(title))
}
