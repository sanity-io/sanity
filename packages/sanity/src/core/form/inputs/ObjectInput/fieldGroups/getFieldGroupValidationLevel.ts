import {type FormNodeValidation, type Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'

import {type FormFieldGroup} from '../../../store'

export function getFieldGroupValidationLevel(
  group: FormFieldGroup,
  groupPath: Path,
  validation: FormNodeValidation[],
): 'error' | 'warning' | 'info' | undefined {
  let highestLevel: 'error' | 'warning' | 'info' | undefined

  for (const field of group.fields) {
    const fieldPath = groupPath.concat(field.name)

    for (const v of validation) {
      if (PathUtils.startsWith(v.path, fieldPath)) {
        if (v.level === 'error') {
          return 'error' // Early return - nothing can be higher priority
        }
        if (v.level === 'warning') {
          highestLevel = 'warning'
        } else if (v.level === 'info' && highestLevel === undefined) {
          highestLevel = 'info'
        }
      }
    }
  }

  return highestLevel
}
