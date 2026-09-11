import {Stack} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {Flex, Box} from 'ui5'

import {listWrapper, listWrapperMaxHeightVar, root, rootVisible, stackWrapper} from './timeline.css'

export function StackWrapper(props: ComponentProps<typeof Stack>) {
  const {className, ...rest} = props
  return <Stack {...rest} className={clsx(stackWrapper, className)} />
}

export function ListWrapper(props: ComponentProps<typeof Flex> & {$maxHeight: string}) {
  const {$maxHeight, className, style, ...rest} = props
  return (
    <Flex
      {...rest}
      className={clsx(listWrapper, className)}
      style={{...assignInlineVars({[listWrapperMaxHeightVar]: $maxHeight}), ...style}}
    />
  )
}

export function Root(props: ComponentProps<typeof Box> & {$visible?: boolean}) {
  const {$visible, className, ...rest} = props
  return <Box {...rest} className={clsx(root, $visible && rootVisible, className)} />
}
