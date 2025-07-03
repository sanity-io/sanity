import {CheckmarkCircleIcon, ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {useMemo} from 'react'
import {
  type DocumentInspector,
  type DocumentInspectorMenuItem,
  type DocumentInspectorUseMenuItemProps,
  type FormNodeValidation,
  isGoingToUnpublish,
  isValidationError,
  isValidationWarning,
  usePerspective,
  useTranslation,
  useValidationStatus,
} from 'sanity'

import {VALIDATION_INSPECTOR_NAME} from '../../constants'
import {useDocumentPane} from '../../useDocumentPane'
import {ValidationInspector} from './ValidationInspector'

function useMenuItem(props: DocumentInspectorUseMenuItemProps): DocumentInspectorMenuItem {
  const {documentId, documentType} = props
  const {t} = useTranslation('validation')
  const {selectedReleaseId} = usePerspective()
  const {validation: validationMarkers} = useValidationStatus(
    documentId,
    documentType,
    selectedReleaseId,
  )
  const {value} = useDocumentPane()

  const validation: FormNodeValidation[] = useMemo(
    () =>
      validationMarkers.map((item) => ({
        level: item.level,
        message: item.message,
        path: item.path,
      })),
    [validationMarkers],
  )

  const hasErrors = validation.some(isValidationError)
  const hasWarnings = validation.some(isValidationWarning)
  const isDocumentGoingToUnpublish = isGoingToUnpublish(value)

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
    hidden: validation.length === 0 || isDocumentGoingToUnpublish,
    icon,
    title: t('panel.title'),
    tone,
    showAsAction: true,
  }
}

export const validationInspector: DocumentInspector = {
  name: VALIDATION_INSPECTOR_NAME,
  component: ValidationInspector,
  useMenuItem,
}
