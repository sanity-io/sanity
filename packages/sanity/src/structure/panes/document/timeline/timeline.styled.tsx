import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'
import {Flex, Box, VStack} from 'ui5'

import {listWrapper, listWrapperMaxHeightVar, root, rootVisible, stackWrapper} from './timeline.css'

export function StackWrapper(props: ComponentProps<typeof VStack>) {
  const {className, ...rest} = props
  return <VStack {...rest} className={clsx(stackWrapper, className)} />
}

export function ListWrapper(props: ComponentProps<typeof Flex> & {$maxHeight: string}) {
  const {$maxHeight, className, style, ...rest} = props
  return (
    <Flex
      {...rest}
      className={clsx(listWrapper, className)}
      style={{[listWrapperMaxHeightVar]: $maxHeight, ...style} as CSSProperties}
    />
  )
}

export function Root(props: ComponentProps<typeof Box> & {$visible?: boolean}) {
  const {$visible, className, ...rest} = props
  return <Box {...rest} className={clsx(root, $visible && rootVisible, className)} />
}
