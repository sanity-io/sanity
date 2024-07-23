import {
  Box,
  Button, // eslint-disable-line no-restricted-imports
  Flex,
  Grid,
  Popover, // eslint-disable-line no-restricted-imports
  Text,
  useClickOutsideEvent,
  useGlobalKeyDown,
  useLayer,
} from '@sanity/ui'
import {useCallback, useRef} from 'react'
import {type DocumentActionConfirmDialogProps, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {POPOVER_FALLBACK_PLACEMENTS} from './constants'

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
      placement="top"
      portal
      preventOverflow
      referenceElement={referenceElement}
    />
  )
}

/**
 * Dialog rendered by custom document actions of dialog type `confirm`.
 * As these are user configurable with public facing APIs, internal studio ui-components are not used.
 */
function ConfirmDialogContent(props: {dialog: DocumentActionConfirmDialogProps}) {
  const {dialog} = props
  const {
    cancelButtonIcon,
    cancelButtonText,
    confirmButtonIcon,
    confirmButtonText,
    // color,
    message,
    onCancel,
    onConfirm,
    tone,
  } = dialog
  const {t} = useTranslation(structureLocaleNamespace)
  const {isTopLayer} = useLayer()
  const ref = useRef<HTMLDivElement | null>(null)

  const handleGlobalKeyDown = useCallback(
    (event: any) => {
      if (event.key === 'Escape' && isTopLayer) onCancel()
    },
    [isTopLayer, onCancel],
  )

  useGlobalKeyDown(handleGlobalKeyDown)
  useClickOutsideEvent(isTopLayer && onCancel, () => [ref.current])

  return (
    <Flex direction="column" ref={ref} style={{minWidth: 320 - 16, maxWidth: 400}}>
      <Box flex={1} overflow="auto" padding={4}>
        <Text>{message}</Text>
      </Box>
      <Box paddingX={4} paddingY={3} style={{borderTop: '1px solid var(--card-border-color)'}}>
        <Grid columns={2} gap={2}>
          <Button
            data-testid="confirm-dialog-cancel-button"
            icon={cancelButtonIcon}
            onClick={onCancel}
            mode="ghost"
            text={cancelButtonText || t('confirm-dialog.cancel-button.fallback-text')}
          />
          <Button
            data-testid="confirm-dialog-confirm-button"
            icon={confirmButtonIcon}
            onClick={onConfirm}
            text={confirmButtonText || t('confirm-dialog.confirm-button.fallback-text')}
            tone={tone}
          />
        </Grid>
      </Box>
    </Flex>
  )
}
