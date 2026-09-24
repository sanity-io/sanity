import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps} from 'ui5'

import {Popover} from '../../../../../../ui-components/popover/Popover'
import {contentHeaderBox, contentScrollerBox, rootPopover} from './PopoverModal.styles.css'

export function RootPopover(props: ComponentProps<typeof Popover>) {
  const {className, ...rest} = props
  return <Popover {...rest} className={clsx(rootPopover, className)} />
}

type DivBoxProps = BoxProps & Omit<ComponentPropsWithRef<'div'>, keyof BoxProps>

export function ContentScrollerBox(props: DivBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(contentScrollerBox, className)} />
}

export function ContentHeaderBox(props: DivBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(contentHeaderBox, className)} />
}
