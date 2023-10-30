import {Button, Flex, Dialog as UIDialog, DialogProps as UIDialogProps, Box} from '@sanity/ui'
import React, {ComponentProps, forwardRef} from 'react'

/** @internal */
export interface DialogProps
  extends Pick<
    UIDialogProps,
    | 'header'
    | 'contentRef'
    | '__unstable_autoFocus'
    | '__unstable_hideCloseButton'
    | 'id'
    | 'onActivate'
    | 'onClickOutside'
    | 'onClose'
    | 'portal'
    | 'position'
    | 'scheme'
    | 'width'
  > {
  children?: React.ReactNode
  footer?: {
    // TODO: When `@sanity/ui` has `Button` component, use those props instead.
    cancelButton?: ComponentProps<typeof Button>
    confirmButton?: ComponentProps<typeof Button>
  }
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
  {footer, children, ...props}: DialogProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <UIDialog
      {...props}
      ref={ref}
      footer={
        (footer?.confirmButton || footer?.cancelButton) && (
          <Flex width="full" gap={3} justify="flex-end" padding={3}>
            {props.onClose && (
              <Button
                mode="bleed"
                text="Cancel"
                tone="default"
                onClick={props.onClose}
                {...footer.cancelButton}
              />
            )}
            {footer.confirmButton && (
              <Button mode="default" text="Confirm" tone="critical" {...footer.confirmButton} />
            )}
          </Flex>
        )
      }
    >
      <Box paddingX={3}>{children}</Box>
    </UIDialog>
  )
})
