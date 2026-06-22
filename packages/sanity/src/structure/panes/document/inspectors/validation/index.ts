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
  mergeParseErrors,
  useParseErrors,
  useTranslation,
} from 'sanity'

import {VALIDATION_INSPECTOR_NAME} from '../../constants'
import {useDocumentPane} from '../../useDocumentPane'
import {ValidationInspector} from './ValidationInspector'

function useMenuItem(_props: DocumentInspectorUseMenuItemProps): DocumentInspectorMenuItem {
  const {t} = useTranslation('validation')
  // Read the same validation the inspector panel uses (from the document pane),
  // rather than fetching it directly from the live document. This keeps the
  // status-bar badge and the panel in sync — e.g. both are empty while viewing
  // a historical revision, where validation is suppressed. Reading it directly
  // here would leave a stale red badge that opens an empty panel.
  const {validation: validationMarkers, value} = useDocumentPane()
  const parseErrors = useParseErrors()

  const validation: FormNodeValidation[] = useMemo(() => {
    const merged = mergeParseErrors(validationMarkers, parseErrors)
    return merged.map((item) => ({
      level: item.level,
      message: item.message,
      path: item.path,
    }))
  }, [validationMarkers, parseErrors])

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
