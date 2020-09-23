import React, {useCallback} from 'react'
import {
  ObjectSchemaType,
  Path,
  Marker,
  isValidationErrorMarker,
  isValidationWarningMarker
} from '@sanity/types'
import ValidationListItem from './ValidationListItem'

import styles from './ValidationList.css'

interface ValidationListProps {
  documentType?: ObjectSchemaType
  kind?: 'simple'
  markers: Marker[]
  onFocus?: (path: Path) => void
  onClose?: () => void
  // showLink?: boolean
  truncate?: boolean
}

function ValidationList(props: ValidationListProps) {
  const {
    documentType,
    kind,
    markers,
    onFocus,
    onClose,
    truncate
    // showLink,
  } = props

  const errors = markers.filter(isValidationErrorMarker)
  const warnings = markers.filter(isValidationWarningMarker)

  const handleClick = useCallback(
    (path: Path = []) => {
      if (onFocus) onFocus(path)
      if (onClose) onClose()
    },
    [onFocus, onClose]
  )

  const resolvePathTitle = (path: Path) => {
    const fields = documentType && documentType.fields
    const field = fields && fields.find(curr => curr.name === path[0])

    return (field && field.type.title) || ''
  }

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0

  if (!hasErrors && !hasWarnings) {
    return null
  }

  return (
    <ul className={styles.root} data-kind={kind}>
      {hasErrors &&
        errors.map((error, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li className={styles.item} key={i}>
            <ValidationListItem
              kind={kind}
              truncate={truncate}
              path={resolvePathTitle(error.path)}
              marker={error}
              onClick={handleClick}
              // showLink={showLink}
            />
          </li>
        ))}

      {hasWarnings &&
        warnings.map((warning, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li className={styles.item} key={i}>
            <ValidationListItem
              kind={kind}
              truncate={truncate}
              path={resolvePathTitle(warning.path)}
              marker={warning}
              onClick={handleClick}
              // showLink={showLink}
            />
          </li>
        ))}
    </ul>
  )
}

export default ValidationList
