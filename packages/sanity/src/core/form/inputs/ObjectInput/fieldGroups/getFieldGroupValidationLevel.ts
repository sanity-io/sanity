import {ALL_FIELDS_GROUP_NAME} from '@sanity/schema/_internal'
import {type FormNodeValidation, type Path} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'

import {type FormFieldGroup} from '../../../store/types/fieldGroup'

export function getFieldGroupValidationLevel(
  group: FormFieldGroup,
  groupPath: Path,
  validation: FormNodeValidation[],
): 'error' | 'warning' | 'info' | undefined {
  let highestLevel: 'error' | 'warning' | 'info' | undefined

  // Special case: "all-fields" group shows all validations regardless of field
  if (group.name === ALL_FIELDS_GROUP_NAME) {
    for (const v of validation) {
      if (v.level === 'error') {
        return 'error'
      }
      if (v.level === 'warning') {
        highestLevel = 'warning'
      } else if (v.level === 'info' && highestLevel === undefined) {
        highestLevel = 'info'
      }
    }
    return highestLevel
  }

  for (const field of group.fields) {
    const fieldPath = groupPath.concat(field.name)

    for (const v of validation) {
      if (PathUtils.startsWith(fieldPath, v.path)) {
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

/** Marker paths that belong to this group. The all-fields group is not a specific selection. */
export function getFieldGroupValidationPaths(
  group: FormFieldGroup,
  groupPath: Path,
  validation: FormNodeValidation[],
): Path[] {
  if (group.name === ALL_FIELDS_GROUP_NAME) return []

  const paths: Path[] = []
  for (const field of group.fields) {
    const fieldPath = groupPath.concat(field.name)
    for (const marker of validation) {
      if (PathUtils.startsWith(fieldPath, marker.path)) {
        paths.push(marker.path)
      }
    }
  }
  return paths
}
