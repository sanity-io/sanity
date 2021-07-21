import React, {useCallback} from 'react'
import {
  ObjectSchemaType,
  Path,
  Marker,
  isValidationErrorMarker,
  isValidationWarningMarker,
} from '@sanity/types'
import styled from 'styled-components'
import {ListItem} from './listItem'

interface ValidationListProps {
  documentType?: ObjectSchemaType
  kind?: 'simple'
  markers: Marker[]
  onFocus?: (path: Path) => void
  onClose?: () => void
  truncate?: boolean
}

const ListContainer = styled.div`
  max-width: 250px;
  max-height: 60vh;
  overflow: auto;
`

export function ValidationList(props: ValidationListProps) {
  const {documentType, kind, markers, onFocus, onClose, truncate} = props

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
    const field = fields && fields.find((curr) => curr.name === path[0])

    return (field && field.type.title) || ''
  }

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0

  if (!hasErrors && !hasWarnings) {
    return null
  }

  return (
    <ListContainer data-kind={kind}>
      {hasErrors &&
        errors.map((error, i) => (
          <ListItem
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            truncate={truncate}
            path={resolvePathTitle(error.path)}
            marker={error}
            onClick={handleClick}
          />
        ))}
      {hasWarnings &&
        warnings.map((warning, i) => (
          <ListItem
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            truncate={truncate}
            path={resolvePathTitle(warning.path)}
            marker={warning}
            onClick={handleClick}
          />
        ))}
    </ListContainer>
  )
}
