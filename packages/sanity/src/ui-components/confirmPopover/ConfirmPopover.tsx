/* eslint-disable no-restricted-imports, @sanity/i18n/no-i18next-import */
import {
  Box,
  Button as UIButton,
  Flex,
  Grid,
  Popover as UIPopover,
  type PopoverProps as UIPopoverProps,
  Text,
  useClickOutsideEvent,
  useGlobalKeyDown,
  useLayer,
} from '@sanity/ui'
import {type ComponentType, type ReactNode, useCallback, useRef} from 'react'
import {useTranslation} from 'react-i18next'

export interface ConfirmPopoverProps {
  cancelButtonIcon?: ReactNode | ComponentType
  cancelButtonText?: string
  confirmButtonIcon?: ReactNode | ComponentType
  confirmButtonText?: string
  message: ReactNode
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  referenceElement: HTMLElement | null
  tone?: 'default' | 'primary' | 'positive' | 'caution' | 'critical' | 'neutral' | 'suggest'
  placement?: UIPopoverProps['placement']
  fallbackPlacements?: UIPopoverProps['fallbackPlacements']
}

/**
 * A popover component for inline confirmation dialogs.
 * Follows the same pattern as document action confirm dialogs.
 *
 * @internal
 */
export function ConfirmPopover({
  cancelButtonIcon,
  cancelButtonText,
  confirmButtonIcon,
  confirmButtonText,
  message,
  onCancel,
  onConfirm,
  open,
  referenceElement,
  tone = 'critical',
  placement = 'top',
  fallbackPlacements = ['left', 'bottom'],
}: ConfirmPopoverProps) {
  if (!open) return null

  return (
    <UIPopover
      content={
        <ConfirmPopoverContent
          cancelButtonIcon={cancelButtonIcon}
          cancelButtonText={cancelButtonText}
          confirmButtonIcon={confirmButtonIcon}
          confirmButtonText={confirmButtonText}
          message={message}
          onCancel={onCancel}
          onConfirm={onConfirm}
          tone={tone}
        />
      }
      constrainSize
      fallbackPlacements={fallbackPlacements}
      open
      placement={placement}
      portal
      preventOverflow
      referenceElement={referenceElement}
    />
  )
}

function ConfirmPopoverContent({
  cancelButtonIcon,
  cancelButtonText,
  confirmButtonIcon,
  confirmButtonText,
  message,
  onCancel,
  onConfirm,
  tone,
}: Omit<ConfirmPopoverProps, 'open' | 'referenceElement' | 'placement' | 'fallbackPlacements'>) {
  const {t} = useTranslation()
  const {isTopLayer} = useLayer()
  const ref = useRef<HTMLDivElement | null>(null)

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTopLayer) onCancel()
    },
    [isTopLayer, onCancel],
  )

  useGlobalKeyDown(handleGlobalKeyDown)
  useClickOutsideEvent(isTopLayer && onCancel, () => [ref.current])

  return (
    <Flex direction="column" ref={ref} style={{minWidth: 280, maxWidth: 350}}>
      <Box flex={1} overflow="auto" padding={4}>
        <Text size={1}>{message}</Text>
      </Box>
      <Box paddingX={4} paddingY={3} style={{borderTop: '1px solid var(--card-border-color)'}}>
        <Grid gridTemplateColumns={2} gap={2}>
          <UIButton
            data-testid="confirm-popover-cancel-button"
            icon={cancelButtonIcon}
            onClick={onCancel}
            mode="ghost"
            padding={2}
            text={cancelButtonText || t('common.dialog.cancel-button.text')}
            fontSize={1}
          />
          <UIButton
            data-testid="confirm-popover-confirm-button"
            icon={confirmButtonIcon}
            onClick={onConfirm}
            padding={2}
            text={confirmButtonText || t('common.dialog.confirm-button.text')}
            tone={tone}
            fontSize={1}
          />
        </Grid>
      </Box>
    </Flex>
  )
}
