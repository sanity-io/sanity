import {useTranslation} from '../../../i18n'
import type {Diff} from '../../types'

/** @internal */
export function useChangeVerb(diff: Diff): string {
  const {t} = useTranslation()
  const hadPrevValue = hasValue(diff.fromValue)
  const hasNextValue = hasValue(diff.toValue)
  if (!hadPrevValue && hasNextValue) {
    return t('changes.added-label')
  }

  if (!hasNextValue && hadPrevValue) {
    return t('changes.removed-label')
  }

  return t('changes.changed-label')
}

/** @internal */
function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
