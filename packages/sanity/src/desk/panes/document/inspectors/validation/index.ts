import {CheckmarkCircleIcon, ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {useMemo} from 'react'
import {getValidationInspectorName} from '../../getValidationInspectorName'
import {ValidationInspector} from './ValidationInspector'
import {
  DocumentInspector,
  DocumentInspectorMenuItem,
  DocumentInspectorUseMenuItemProps,
  FormNodeValidation,
  isValidationError,
  isValidationWarning,
  useValidationStatus,
} from 'sanity'

function useMenuItem(props: DocumentInspectorUseMenuItemProps): DocumentInspectorMenuItem {
  const {documentId, documentType} = props
  const {validation: validationMarkers} = useValidationStatus(documentId, documentType)

  const validation: FormNodeValidation[] = useMemo(
    () =>
      validationMarkers.map((item) => ({
        level: item.level,
        message: item.item.message,
        path: item.path,
      })),
    [validationMarkers]
  )

  const hasErrors = validation.some(isValidationError)
  const hasWarnings = validation.some(isValidationWarning)

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
    hidden: validation.length === 0,
    icon,
    title: 'Validation',
    tone,
    showAsAction: true,
  }
}

export function validationInspector(deskConfigName?: string): DocumentInspector {
  return {
    name: getValidationInspectorName(deskConfigName),
    component: ValidationInspector,
    useMenuItem,
  }
}
