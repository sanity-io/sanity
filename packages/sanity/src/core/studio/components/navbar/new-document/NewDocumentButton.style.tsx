import {Card, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Flex, type FlexProps} from 'ui5'

import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {Popover} from '../../../../../ui-components/popover/Popover'
import {
  dialog,
  dialogHeaderCard,
  itemHeightVar,
  maxItemsVar,
  popover,
  popoverHeaderCard,
  popoverListFlex,
  radius3Var,
} from './NewDocumentButton.css'

type FlexWrapperProps = FlexProps & Omit<ComponentPropsWithRef<'div'>, keyof FlexProps>

export function StyledPopover(props: ComponentProps<typeof Popover>) {
  const {className, style, ...rest} = props
  const {radius} = useThemeV2()

  return (
    <Popover
      {...rest}
      className={clsx(popover, className)}
      style={{...assignInlineVars({[radius3Var]: `${radius[3]}px`}), ...style}}
    />
  )
}

export function StyledDialog(props: ComponentProps<typeof Dialog> & {className?: string}) {
  const {className, ...rest} = props

  return <Dialog {...rest} className={clsx(dialog, className)} />
}

/** Carries no styles of its own; kept so call sites keep their import. */
export const RootFlex = Flex

export function PopoverHeaderCard(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props

  return <Card {...rest} className={clsx(popoverHeaderCard, className)} />
}

export function DialogHeaderCard(props: ComponentProps<typeof Card>) {
  const {className, ...rest} = props

  return <Card {...rest} className={clsx(dialogHeaderCard, className)} />
}

export function PopoverListFlex(
  props: FlexWrapperProps & {
    $maxDisplayedItems: number
    $itemHeight: number
  },
) {
  const {$maxDisplayedItems, $itemHeight, className, style, ...rest} = props

  return (
    <Flex
      {...rest}
      className={clsx(popoverListFlex, className)}
      style={{
        ...assignInlineVars({
          [itemHeightVar]: `${$itemHeight}px`,
          [maxItemsVar]: String($maxDisplayedItems),
        }),
        ...style,
      }}
    />
  )
}
