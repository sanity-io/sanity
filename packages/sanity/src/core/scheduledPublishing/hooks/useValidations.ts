import {useState} from 'react'

import {type Schedule, type ScheduledDocValidations, type ValidationStatus} from '../types'

const EMPTY_VALIDATIONS: ScheduledDocValidations = {}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useValidations() {
  const [validations, setValidations] = useState<ScheduledDocValidations>(EMPTY_VALIDATIONS)
  const updateValidation = (s: Schedule, vs: ValidationStatus) =>
    setValidations((current) => ({...current, [s.id]: vs}))

  return [validations, updateValidation] as [typeof validations, typeof updateValidation]
}
