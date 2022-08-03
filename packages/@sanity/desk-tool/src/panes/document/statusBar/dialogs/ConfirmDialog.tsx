import {DocumentActionConfirmDialogProps} from '@sanity/base'
import {
  Box,
  Button,
  Flex,
  Grid,
  Popover,
  useClickOutside,
  useGlobalKeyDown,
  useLayer,
} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {LEGACY_DIALOG_TO_UI_COLOR, POPOVER_FALLBACK_PLACEMENTS} from './constants'

export function ConfirmDialog(props: {
  dialog: DocumentActionConfirmDialogProps
  referenceElement: HTMLElement | null
}) {
  const {dialog, referenceElement} = props

  return (
    <Popover
      content={<ConfirmDialogContent dialog={dialog} />}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      open
      tone="default"
      placement="top"
      portal
      preventOverflow
      referenceElement={referenceElement}
    />
  )
}

function ConfirmDialogContent(props: {dialog: DocumentActionConfirmDialogProps}) {
  const {dialog} = props
  const {
    cancelButtonIcon,
    cancelButtonText,
    confirmButtonIcon,
    confirmButtonText,
    color,
    message,
    onCancel,
    onConfirm,
  } = dialog
  const {isTopLayer} = useLayer()
  const [element, setElement] = useState<HTMLElement | null>(null)

  const handleClickOutside = useCallback(() => {
    if (isTopLayer) onCancel()
  }, [isTopLayer, onCancel])

  const handleGlobalKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape' && isTopLayer) onCancel()
    },
    [isTopLayer, onCancel]
  )

  useClickOutside(handleClickOutside, [element])
  useGlobalKeyDown(handleGlobalKeyDown)

  return (
    <Flex direction="column" ref={setElement} style={{minWidth: 320 - 16, maxWidth: 400}}>
      <Box flex={1} overflow="auto" padding={4}>
        {message}
      </Box>
      <Box paddingX={4} paddingY={3} style={{borderTop: '1px solid var(--card-border-color)'}}>
        <Grid columns={2} gap={2}>
          <Button
            icon={cancelButtonIcon}
            onClick={onCancel}
            mode="ghost"
            text={cancelButtonText || 'Cancel'}
          />
          <Button
            autoFocus
            icon={confirmButtonIcon}
            onClick={onConfirm}
            text={confirmButtonText || 'Confirm'}
            tone={color ? LEGACY_DIALOG_TO_UI_COLOR[color] : 'primary'}
          />
        </Grid>
      </Box>
    </Flex>
  )
}
