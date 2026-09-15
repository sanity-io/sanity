import {type FormNodeValidation} from '@sanity/types'
import {useMemo} from 'react'

import {EMPTY_ARRAY} from '../../../../util/empty'
import {type BaseFormNode} from '../../../store/types/nodes'
import {useImmutableReconcile} from '../../../store/utils/useImmutableReconcile'
import {useChildValidation} from '../../../studio/contexts/Validation'
import {isBlockType} from '../_helpers'

const NONEXISTENT_PATH = ['@@_NONEXISTENT_PATH_@@']

/** @internal */
export function useMemberValidation(member: BaseFormNode | undefined) {
  const memberValidation =
    member?.validation && member.validation.length > 0 ? member.validation : EMPTY_ARRAY
  const childValidation = useChildValidation(member?.path || NONEXISTENT_PATH)

  const validation = useMemo(
    () =>
      member?.schemaType && isBlockType(member?.schemaType)
        ? memberValidation
        : memberValidation.concat(childValidation),
    [childValidation, member, memberValidation],
  )

  const [hasError, hasWarning, hasInfo] = useMemo(
    () => [
      validation.filter((v) => v.level === 'error').length > 0,
      validation.filter((v) => v.level === 'warning').length > 0,
      validation.filter((v) => v.level === 'info').length > 0,
    ],
    [validation],
  )

  const reconcile = useImmutableReconcile<FormNodeValidation[]>()
  const reconciled = reconcile(validation)

  return useMemo(() => {
    return {
      validation: reconciled,
      hasError,
      hasWarning,
      hasInfo,
    }
  }, [reconciled, hasError, hasWarning, hasInfo])
}
