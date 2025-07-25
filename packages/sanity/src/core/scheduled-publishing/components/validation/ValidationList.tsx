import {
  isValidationErrorMarker,
  isValidationInfoMarker,
  isValidationWarningMarker,
  type ObjectSchemaType,
  type Path,
  type ValidationMarker,
} from '@sanity/types'
import {Container} from '@sanity/ui'
import {useCallback} from 'react'

import {ValidationListItem} from './ValidationListItem'

/** @internal */
export interface ValidationListProps {
  documentType?: ObjectSchemaType
  kind?: 'simple'
  validation: ValidationMarker[]
  onFocus?: (path: Path) => void
  onClose?: () => void
  truncate?: boolean
}

/** @internal */
export function ValidationList(props: ValidationListProps) {
  const {documentType, kind, validation, onFocus, onClose, truncate} = props
  const errors = validation.filter(isValidationErrorMarker)
  const warnings = validation.filter(isValidationWarningMarker)
  const info = validation.filter(isValidationInfoMarker)

  const handleClick = useCallback(
    (path: Path = []) => {
      if (onFocus) onFocus(path)
      if (onClose) onClose()
    },
    [onFocus, onClose],
  )

  const resolvePathTitle = (path: Path) => {
    const fields = documentType && documentType.fields
    const field = fields && fields.find((curr) => curr.name === path[0])

    return (field && field.type.title) || ''
  }

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const hasInfo = info.length > 0

  if (!hasErrors && !hasWarnings && !hasInfo) {
    return null
  }

  return (
    <Container width={0} data-kind={kind} data-testid="validation-list">
      {hasErrors &&
        errors.map((_error, i) => (
          <ValidationListItem
            // oxlint-disable-next-line no-array-index-key
            key={i}
            truncate={truncate}
            path={resolvePathTitle(_error.path)}
            marker={_error}
            onClick={handleClick}
          />
        ))}
      {hasWarnings &&
        warnings.map((_warning, i) => (
          <ValidationListItem
            // oxlint-disable-next-line no-array-index-key
            key={i}
            truncate={truncate}
            path={resolvePathTitle(_warning.path)}
            marker={_warning}
            onClick={handleClick}
          />
        ))}
      {hasInfo &&
        info.map((_info, i) => (
          <ValidationListItem
            // oxlint-disable-next-line no-array-index-key
            key={i}
            truncate={truncate}
            path={resolvePathTitle(_info.path)}
            marker={_info}
            onClick={handleClick}
          />
        ))}
    </Container>
  )
}
