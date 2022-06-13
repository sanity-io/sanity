import {useMemo} from 'react'
import {BaseFormNode} from '../../../store'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {useChildValidation} from '../../../studio/contexts/Validation'
import {_isBlockType} from '../_helpers'

const NONEXISTENT_PATH = ['@@_NONEXISTENT_PATH_@@']

export function useMemberValidation(member: BaseFormNode | undefined) {
  const memberValidation = member?.validation || EMPTY_ARRAY
  const childValidation = useChildValidation(member?.path || NONEXISTENT_PATH)

  const validation = useMemo(
    () =>
      member?.schemaType && _isBlockType(member?.schemaType)
        ? memberValidation
        : memberValidation.concat(childValidation),
    [childValidation, member, memberValidation]
  )

  const [hasError, hasWarning, hasInfo] = useMemo(
    () => [
      validation.filter((v) => v.level === 'error').length > 0,
      validation.filter((v) => v.level === 'warning').length > 0,
      validation.filter((v) => v.level === 'info').length > 0,
    ],
    [validation]
  )

  return useMemo(() => {
    return {
      validation,
      hasError,
      hasWarning,
      hasInfo,
    }
  }, [validation, hasError, hasWarning, hasInfo])
}
