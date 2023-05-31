import {CheckmarkCircleIcon, ErrorOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {lazy} from 'react'
import {DocumentInspector, FormNodeValidation, isValidationError, isValidationWarning} from 'sanity'

export const validationInspector: DocumentInspector = {
  name: 'validation',
  component: lazy(() => import('./inspector')),
  showAsAction: true,
  menuItem: ({validation}) => {
    const formNodeValidation: FormNodeValidation[] = validation.map((item) => ({
      level: item.level,
      path: item.path,
      message: item.item.message,
    }))

    const hasErrors = formNodeValidation.filter(isValidationError).length > 0
    const hasWarnings = formNodeValidation.filter(isValidationWarning).length > 0

    return {
      // hidden: validation.length === 0,
      // eslint-disable-next-line no-nested-ternary
      icon: hasErrors ? ErrorOutlineIcon : hasWarnings ? WarningOutlineIcon : CheckmarkCircleIcon,
      title: 'Validation',
      // eslint-disable-next-line no-nested-ternary
      tone: hasErrors ? 'critical' : hasWarnings ? 'caution' : 'positive',
    }
  },
}
