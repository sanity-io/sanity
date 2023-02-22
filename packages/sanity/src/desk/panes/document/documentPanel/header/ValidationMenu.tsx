import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {
  isValidationInfoMarker,
  isValidationWarningMarker,
  isValidationErrorMarker,
  Path,
} from '@sanity/types'
import {Button, ButtonProps, Menu, MenuButton} from '@sanity/ui'
import React, {useCallback, useMemo, useId} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {ValidationList} from 'sanity'

export interface ValidationMenuProps {
  boundaryElement: HTMLDivElement | null
  isOpen: boolean
  setOpen: (val: boolean) => void
}

const BUTTON_PROPS: Record<'error' | 'warning' | 'info', ButtonProps> = {
  error: {
    tone: 'critical',
    icon: ErrorOutlineIcon,
  },
  warning: {
    tone: 'caution',
    icon: WarningOutlineIcon,
  },
  info: {
    tone: 'primary',
    icon: InfoOutlineIcon,
  },
}

export function ValidationMenu(props: ValidationMenuProps) {
  const {boundaryElement, isOpen, setOpen} = props
  const {onFocus, onPathOpen, schemaType, validation} = useDocumentPane()
  const id = useId()
  const hasValidationMarkers = validation.length > 0
  const hasErrorMarkers = validation.some(isValidationErrorMarker)
  const hasWarningMarkers = validation.some(isValidationWarningMarker)
  const hasInfoMarkers = validation.some(isValidationInfoMarker)

  const buttonProps = useMemo(() => {
    if (hasErrorMarkers) return BUTTON_PROPS.error
    if (hasWarningMarkers) return BUTTON_PROPS.warning
    if (hasInfoMarkers) return BUTTON_PROPS.info
    return undefined
  }, [hasErrorMarkers, hasInfoMarkers, hasWarningMarkers])

  const handleOpen = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onFocus(path)
    },
    [onFocus, onPathOpen]
  )

  const handleClose = useCallback(() => setOpen(false), [setOpen])

  if (!hasValidationMarkers) return null

  return (
    <MenuButton
      id={id || ''}
      button={
        <Button
          {...buttonProps}
          title="Show validation issues"
          mode="bleed"
          data-testid="validation-list-button"
        />
      }
      menu={
        <Menu open={isOpen}>
          <ValidationList
            documentType={schemaType}
            validation={validation}
            onClose={handleClose}
            onFocus={handleOpen}
          />
        </Menu>
      }
      popover={{
        portal: true,
        boundaryElement: boundaryElement,
        constrainSize: true,
        preventOverflow: true,
        width: 0,
      }}
      placement="bottom"
    />
  )
}
