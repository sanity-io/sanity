import {useId} from '@reach/auto-id'
import {ValidationList} from '@sanity/base/components'
import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {
  isValidationInfoMarker,
  isValidationWarningMarker,
  isValidationErrorMarker,
} from '@sanity/types'
import {Button, ButtonProps, Menu, MenuButton} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {useFocusPath} from '../../focusPath'

interface ValidationMenuProps {
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
  const {documentSchema, markers} = useDocumentPane()
  const id = useId()

  const {onFocus} = useFocusPath()

  const validationMarkers = useMemo(
    () => markers.filter((marker) => marker.type === 'validation'),
    [markers]
  )

  const validationErrorMarkers = useMemo(() => validationMarkers.filter(isValidationErrorMarker), [
    validationMarkers,
  ])

  const validationWarningMarkers = useMemo(
    () => validationMarkers.filter(isValidationWarningMarker),
    [validationMarkers]
  )

  const validationInfoMarkers = useMemo(() => validationMarkers.filter(isValidationInfoMarker), [
    validationMarkers,
  ])

  const hasError = validationErrorMarkers.length > 0
  const hasWarning = validationWarningMarkers.length > 0
  const hasInfo = validationInfoMarkers.length > 0
  const noValidation = !hasError && !hasWarning && !hasInfo

  const buttonProps = useMemo(() => {
    if (hasError) {
      return BUTTON_PROPS.error
    }
    if (hasWarning) {
      return BUTTON_PROPS.warning
    }
    if (hasInfo) {
      return BUTTON_PROPS.info
    }
    return undefined
  }, [hasError, hasInfo, hasWarning])

  const handleClose = useCallback(() => setOpen(false), [setOpen])

  if (noValidation) {
    return null
  }

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
            documentType={documentSchema}
            markers={validationMarkers}
            onClose={handleClose}
            onFocus={onFocus}
          />
        </Menu>
      }
      popover={{
        portal: true,
        boundaryElement: boundaryElement,
        constrainSize: true,
        preventOverflow: true,
        width: 0,
        tone: 'default',
      }}
      placement="bottom-end"
    />
  )
}
