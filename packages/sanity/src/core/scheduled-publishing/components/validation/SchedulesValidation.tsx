import {useEffect, useState} from 'react'

import {useValidationStatus} from '../../../hooks/useValidationStatus'
import {getDraftId} from '../../../util/draftUtils'
import {useScheduleSchemaType} from '../../hooks/useSchemaType'
import {type Schedule, type ValidationStatus} from '../../types'
import {getScheduledDocumentId} from '../../utils/paneItemHelpers'

/**
 * The `listener` of `useValidationStatus`: `global` where many documents' schedules are listed,
 * `document` where the document's pane has its pair checked out already.
 */
export type ScheduleValidationListener = 'document' | 'global'

interface Props {
  schedule: Schedule
  updateValidation: (status: ValidationStatus) => void
  listener: ScheduleValidationListener
}

// Duration to wait before validating (after this component has mounted)
const VALIDATION_DELAY_MS = 1500

/**
 * useValidationStatus requires a published id, and we dont always have that
 *
 * This a boilerplate wrapper component around it,
 * so we conditionally call back with updated status whenver it is possible.
 * */
export function ValidateScheduleDoc({schedule, updateValidation, listener}: Props) {
  const schemaType = useScheduleSchemaType(schedule)
  const id = getScheduledDocumentId(schedule)

  if (!id || !schemaType?.name) {
    return null
  }
  return (
    <DelayedValidationRunner
      id={id}
      schemaName={schemaType.name}
      updateValidation={updateValidation}
      listener={listener}
    />
  )
}

interface ValidationRunnerProps {
  id: string
  schemaName: string
  updateValidation: (status: ValidationStatus) => void
  listener: ScheduleValidationListener
}

function DelayedValidationRunner({
  id,
  schemaName,
  updateValidation,
  listener,
}: ValidationRunnerProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setReady(true)
    }, VALIDATION_DELAY_MS)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (!ready) {
    return null
  }

  return (
    <ValidationRunner
      id={id}
      schemaName={schemaName}
      updateValidation={updateValidation}
      listener={listener}
    />
  )
}

function ValidationRunner({id, schemaName, updateValidation, listener}: ValidationRunnerProps) {
  const draftId = getDraftId(id)
  // No `getTargetScopeId(useTargetDocumentState())` here: scheduled publishing deliberately validates the
  // explicit draft of the scheduled document, independent of the selected perspective.
  // TODO: this will be supported in the future, look for SAPP-3986 and SAPP-3987.
  const validationStatus = useValidationStatus(draftId, schemaName, {listener})

  useEffect(() => {
    if (!validationStatus.isValidating) {
      updateValidation(validationStatus)
    }
  }, [updateValidation, validationStatus])

  return null
}
