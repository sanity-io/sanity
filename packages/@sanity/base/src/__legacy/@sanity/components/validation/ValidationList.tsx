import React, {useCallback} from 'react'
import {
  ObjectSchemaType,
  SchemaType,
  Path,
  Marker,
  isValidationErrorMarker,
  isValidationWarningMarker,
} from '@sanity/types'
import {startCase} from 'lodash'
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
    truncate,
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

  const resolvePathTitle = useCallback(
    (initialPath: Path): string[] => {
      const traverse = (path: Path, schemaType: SchemaType): string[] => {
        const [name, ...restOfPath] = path

        // `startCase` is also used in the `@sanity/schema` to populate titles from the name
        const current = schemaType.title || startCase(schemaType.name)
        let nextField: SchemaType | undefined

        if (schemaType.jsonType === 'object') {
          nextField = schemaType.fields.find((field) => field.name === name)?.type
        } else if (schemaType.jsonType == 'array') {
          nextField = schemaType.of.find((type) => type.name === name)
        }

        const next = nextField ? traverse(restOfPath, nextField) : []
        return [current, ...next]
      }

      const result = traverse(initialPath, documentType)
      // if the resulting title is longer than one path, we can omit the document title
      if (result.length > 1) return result.slice(1)
      return result
    },
    [documentType]
  )

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
