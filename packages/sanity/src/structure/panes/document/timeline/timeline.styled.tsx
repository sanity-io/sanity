import {Box, type BoxProps, Flex, type FlexProps, Stack, type StackProps} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type CSSProperties, forwardRef, type HTMLProps} from 'react'

import {stackWrapper, listWrapper, maxHeightVar, rootVisible, rootHidden} from './timeline.css'

type StackComponentProps = StackProps & Omit<HTMLProps<HTMLDivElement>, 'ref' | 'as'>

export const StackWrapper = forwardRef<HTMLDivElement, StackComponentProps>(
  function StackWrapper(props, ref) {
    return <Stack {...props} className={stackWrapper} ref={ref} />
  },
)

type FlexComponentProps = Omit<FlexProps & Omit<HTMLProps<HTMLDivElement>, 'wrap' | 'as'>, 'ref'>

export const ListWrapper = forwardRef<HTMLDivElement, FlexComponentProps & {$maxHeight: string}>(
  function ListWrapper({$maxHeight, style: styleProp, ...props}, ref) {
    return (
      <Flex
        {...props}
        className={listWrapper}
        style={{
          ...(styleProp as CSSProperties),
          ...assignInlineVars({[maxHeightVar]: $maxHeight}),
        }}
        ref={ref}
      />
    )
  },
)

type BoxComponentProps = BoxProps & Omit<HTMLProps<HTMLDivElement>, 'height' | 'as' | 'ref'>

export const Root = forwardRef<HTMLDivElement, BoxComponentProps & {$visible?: boolean}>(
  function Root({$visible, ...props}, ref) {
    return <Box {...props} className={$visible ? rootVisible : rootHidden} ref={ref} />
  },
)
