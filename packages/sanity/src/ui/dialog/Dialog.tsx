/* eslint-disable no-restricted-imports */
import {
  Button,
  Flex,
  Dialog as UIDialog,
  DialogProps as UIDialogProps,
  Box,
  BoxHeight,
} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'
import {useTranslation} from 'react-i18next'

/** @internal */
export interface DialogProps
  extends Pick<
      UIDialogProps,
      | '__unstable_autoFocus'
      | '__unstable_hideCloseButton'
      | 'contentRef'
      | 'header'
      | 'id'
      | 'onActivate'
      | 'onClickOutside'
      | 'onClose'
      | 'portal'
      | 'position'
      | 'scheme'
      | 'width'
    >,
    Pick<React.HTMLProps<HTMLDivElement>, 'onDragEnter'> {
  /**
   * Dialog body height.
   * Set this to 'fill' (i.e. 100%) if you want overflow body content to be contained
   * and not trigger dynamic border visibility.
   */
  bodyHeight?: BoxHeight
  children?: React.ReactNode
  footer?: {
    // TODO: When `@sanity/ui` has `Button` component, use those props instead.
    // TODO: Omit style-specific props, e.g. fontSize, padding etc
    cancelButton?: ComponentProps<typeof Button>
    confirmButton?: ComponentProps<typeof Button>
  }
  padding?: boolean
}

/**
 * Studio UI <Dialog>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const Dialog = forwardRef(function Dialog(
  {bodyHeight, children, footer, padding = true, ...props}: DialogProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const {t} = useTranslation()

  return (
    <UIDialog
      {...props}
      animate
      ref={ref}
      footer={
        (footer?.confirmButton || footer?.cancelButton) && (
          <Flex width="full" gap={3} justify="flex-end" padding={3}>
            {props.onClose && (
              <Button
                mode="bleed"
                padding={2}
                text={t('common.dialog.cancel-button.text')}
                tone="default"
                onClick={props.onClose}
                {...footer.cancelButton}
              />
            )}
            {footer.confirmButton && (
              <Button
                mode="default"
                padding={2}
                text={t('common.dialog.confirm-button.text')}
                tone="critical"
                {...footer.confirmButton}
              />
            )}
          </Flex>
        )
      }
    >
      <Box height={bodyHeight} padding={padding ? 4 : 0}>
        {children}
      </Box>
    </UIDialog>
  )
})
