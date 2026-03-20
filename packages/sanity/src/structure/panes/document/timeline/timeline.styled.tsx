import {Box, type BoxProps, Flex, type FlexProps, Stack, type StackProps} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {forwardRef} from 'react'

import {stackWrapper, listWrapper, maxHeightVar, rootVisible, rootHidden} from './timeline.css'

export const StackWrapper = forwardRef<HTMLDivElement, StackProps>(
  function StackWrapper(props, ref) {
    return <Stack {...props} className={stackWrapper} ref={ref} />
  },
)

export const ListWrapper = forwardRef<HTMLDivElement, FlexProps & {$maxHeight: string}>(
  function ListWrapper({$maxHeight, style: styleProp, ...props}, ref) {
    return (
      <Flex
        {...props}
        className={listWrapper}
        style={{
          ...styleProp,
          ...assignInlineVars({[maxHeightVar]: $maxHeight}),
        }}
        ref={ref}
      />
    )
  },
)

export const Root = forwardRef<HTMLDivElement, BoxProps & {$visible?: boolean}>(function Root(
  {$visible, ...props},
  ref,
) {
  return <Box {...props} className={$visible ? rootVisible : rootHidden} ref={ref} />
})
