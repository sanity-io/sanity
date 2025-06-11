import {useEffect, useState} from 'react'

import {useValidationStatus} from '../../../hooks/useValidationStatus'
import {useScheduleSchemaType} from '../../hooks/useSchemaType'
import {type Schedule, type ValidationStatus} from '../../types'
import {getScheduledDocumentId} from '../../utils/paneItemHelpers'

interface Props {
  schedule: Schedule
  updateValidation: (status: ValidationStatus) => void
}

// Duration to wait before validating (after this component has mounted)
const VALIDATION_DELAY_MS = 1500

/**
 * useValidationStatus requires a published id, and we dont always have that
 *
 * This a boilerplate wrapper component around it,
 * so we conditionally call back with updated status whenver it is possible.
 * */
export function ValidateScheduleDoc({schedule, updateValidation}: Props) {
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
    />
  )
}

interface ValidationRunnerProps {
  id: string
  schemaName: string
  updateValidation: (status: ValidationStatus) => void
}

function DelayedValidationRunner({id, schemaName, updateValidation}: ValidationRunnerProps) {
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

  return <ValidationRunner id={id} schemaName={schemaName} updateValidation={updateValidation} />
}

function ValidationRunner({id, schemaName, updateValidation}: ValidationRunnerProps) {
  const validationStatus = useValidationStatus(id, schemaName)

  useEffect(() => {
    if (!validationStatus.isValidating) {
      updateValidation(validationStatus)
    }
  }, [updateValidation, validationStatus])

  return null
}
