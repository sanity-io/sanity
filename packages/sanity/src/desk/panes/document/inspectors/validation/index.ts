import {CheckmarkCircleIcon, ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {lazy, useMemo} from 'react'
import {
  DocumentInspector,
  DocumentInspectorMenuItem,
  DocumentInspectorMenuItemContext,
  FormNodeValidation,
  isValidationError,
  isValidationWarning,
  useValidationStatus,
} from 'sanity'

function useMenuItem(props: DocumentInspectorMenuItemContext): DocumentInspectorMenuItem {
  const {documentId, documentType} = props
  const {validation} = useValidationStatus(documentId, documentType)

  const formNodeValidation: FormNodeValidation[] = validation.map((item) => ({
    level: item.level,
    message: item.item.message,
    path: item.path,
  }))

  const hasErrors = formNodeValidation.filter(isValidationError).length > 0
  const hasWarnings = formNodeValidation.filter(isValidationWarning).length > 0

  const icon = useMemo(() => {
    if (hasErrors) return ErrorOutlineIcon
    if (hasWarnings) return WarningOutlineIcon
    return CheckmarkCircleIcon
  }, [hasErrors, hasWarnings])

  const tone = useMemo(() => {
    if (hasErrors) return 'critical'
    if (hasWarnings) return 'caution'
    return 'positive'
  }, [hasErrors, hasWarnings])

  return {
    // hidden: validation.length === 0,
    icon,
    title: 'Validation',
    tone,
    showAsAction: true,
  }
}

export const validationInspector: DocumentInspector = {
  name: 'validation',
  component: lazy(() => import('./inspector')),
  useMenuItem,
}
