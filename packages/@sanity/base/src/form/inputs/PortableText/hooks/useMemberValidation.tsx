import {
  isValidationErrorMarker,
  isValidationInfoMarker,
  isValidationWarningMarker,
} from '@sanity/types'
import {EMPTY_ARRAY} from '@sanity/ui-workshop'
import {isEqual, startsWith} from '@sanity/util/paths'
import {useMemo} from 'react'
import {useValidationMarkers} from '../../../studio/contexts/Validation'
import {ArrayOfObjectsMember, ObjectFormNode} from '../../../types'

export function useMemberValidation(member: ArrayOfObjectsMember<ObjectFormNode> | undefined) {
  const documentValidation = useValidationMarkers()
  const memberValidation = useMemo(
    () =>
      member
        ? documentValidation.filter((item) => {
            // For regular blocks, only if the path is for the block itself (and not pointing to someting inside it)
            if (member.item.schemaType.name === 'block') {
              return isEqual(item.path, member.item.path)
            }
            return startsWith(member.item.path, item.path)
          })
        : EMPTY_ARRAY,
    [documentValidation, member]
  )

  const [hasError, hasWarning, hasInfo] = useMemo(
    () => [
      memberValidation.filter(isValidationErrorMarker).length > 0,
      memberValidation.filter(isValidationWarningMarker).length > 0,
      memberValidation.filter(isValidationInfoMarker).length > 0,
    ],
    [memberValidation]
  )
  const result = useMemo(
    () => ({memberValidation, hasError, hasWarning, hasInfo}),
    [hasError, hasWarning, hasInfo, memberValidation]
  )
  return result
}
