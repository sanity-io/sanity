import {useMemo} from 'react'
import {ArrayOfObjectsItemMember, ObjectFormNode} from '../../../store'
import {EMPTY_ARRAY} from '../../../utils/empty'
import {useChildValidation} from '../../../studio/contexts/Validation'
import {isBlockType} from '../PortableTextInput'

const NONEXISTENT_PATH = ['@@_NONEXISTENT_PATH_@@']

export function useMemberValidation(member: ArrayOfObjectsItemMember<ObjectFormNode> | undefined) {
  const memberValidation = member?.item.validation || EMPTY_ARRAY
  const childValidation = useChildValidation(member?.item.path || NONEXISTENT_PATH)
  const validation =
    member && isBlockType(member.item.schemaType)
      ? memberValidation
      : memberValidation.concat(childValidation)
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
