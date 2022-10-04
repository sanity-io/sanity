import {FormNodeValidation} from '@sanity/types'
import {useMemo, useRef} from 'react'
import {EMPTY_ARRAY} from '../../../../util'
import {BaseFormNode} from '../../../store'
import {immutableReconcile} from '../../../store/utils/immutableReconcile'
import {useChildValidation} from '../../../studio/contexts/Validation'
import {_isBlockType} from '../_helpers'

const NONEXISTENT_PATH = ['@@_NONEXISTENT_PATH_@@']

/** @internal */
export function useMemberValidation(member: BaseFormNode | undefined) {
  const prev = useRef<FormNodeValidation[] | null>(null)
  const memberValidation =
    member?.validation && member.validation.length > 0 ? member.validation : EMPTY_ARRAY
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

  const reconciled = immutableReconcile(prev.current, validation)
  prev.current = reconciled

  return useMemo(() => {
    return {
      validation: reconciled,
      hasError,
      hasWarning,
      hasInfo,
    }
  }, [reconciled, hasError, hasWarning, hasInfo])
}
