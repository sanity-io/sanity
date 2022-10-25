import {CardTone} from '@sanity/ui'
import {FormNodeValidation} from '@sanity/types'

export function useArrayItemTone(props: {
  childValidation: FormNodeValidation[]
  readOnly?: boolean
}): CardTone {
  const {childValidation, readOnly} = props
  const hasErrors = childValidation.some((v) => v.level === 'error')
  const hasWarnings = childValidation.some((v) => v.level === 'warning')

  if (readOnly) {
    return 'transparent'
  }
  if (hasErrors) {
    return 'critical'
  }
  return hasWarnings ? 'caution' : 'default'
}
