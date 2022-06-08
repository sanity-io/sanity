import {useMemo} from 'react'
import {ArrayOfObjectsMember, ObjectFormNode} from '../../../types'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {useChildValidation} from '../../../studio/contexts/Validation'

const NONEXISTENT_PATH = ['@@_NONEXISTENT_PATH_@@']

export function useMemberValidation(member: ArrayOfObjectsMember<ObjectFormNode> | undefined) {
  const memberValidation = member?.item.validation || EMPTY_ARRAY

  const childValidation = useChildValidation(member?.item.path || NONEXISTENT_PATH)
  const [hasError, hasWarning, hasInfo] = useMemo(
    () => [
      memberValidation.filter((v) => v.level === 'error').length > 0,
      memberValidation.filter((v) => v.level === 'warning').length > 0,
      memberValidation.filter((v) => v.level === 'info').length > 0,
    ],
    [memberValidation]
  )
  return useMemo(() => {
    return {
      memberValidation: member?.open ? memberValidation : memberValidation.concat(childValidation),
      hasError,
      hasWarning,
      hasInfo,
    }
  }, [member, memberValidation, childValidation, hasError, hasWarning, hasInfo])
}
