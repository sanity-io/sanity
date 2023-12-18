/* eslint-disable no-restricted-imports */
import {
  Button as UIButton,
  Flex,
  Dialog as UIDialog,
  DialogProps as UIDialogProps,
  Box,
  BoxHeight,
} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'
import {useTranslation} from 'react-i18next'

/** @internal */
export type DialogProps = Pick<
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
> & {
  /**
   * Dialog body height.
   * Set this to 'fill' (i.e. 100%) if you want overflow body content to be contained
   * and not trigger dynamic border visibility.
   */
  bodyHeight?: BoxHeight
  children?: React.ReactNode
  footer?: {
    cancelButton?: Omit<ComponentProps<typeof UIButton>, 'fontSize' | 'padding'>
    confirmButton?: Omit<ComponentProps<typeof UIButton>, 'fontSize' | 'padding'>
  }
  /**
   * If enabled, removes all default padding from dialog content.
   */
  padding?: boolean
}

/**
 * Customized Sanity UI <Dialog> that enforces an opinionated footer layout with a max of two buttons (confirm and cancel).
 *
 * @internal
 */
export const Dialog = forwardRef(function Dialog(
  {
    bodyHeight,
    children,
    footer,
    padding = true,
    ...props
  }: DialogProps & Pick<React.HTMLProps<HTMLDivElement>, 'onDragEnter'>,
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
              <UIButton
                mode="bleed"
                padding={2}
                text={t('common.dialog.cancel-button.text')}
                tone="default"
                onClick={props.onClose}
                {...footer.cancelButton}
              />
            )}
            {footer.confirmButton && (
              <UIButton
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
