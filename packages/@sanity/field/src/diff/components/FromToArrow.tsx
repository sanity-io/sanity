import {Text, TextProps} from '@sanity/ui'
import React, {useMemo} from 'react'
import {ArrowRightIcon, ArrowDownIcon} from '@sanity/icons'

type Direction = 'down' | 'right' | undefined

// Make it possible to add other arrow directions if needed
const ArrowIcon = (dir: Direction) => {
  switch (dir) {
    case 'down':
      return ArrowDownIcon
    default:
      return ArrowRightIcon
  }
}

export const FromToArrow = ({
  direction,
  ...restProps
}: {direction?: Direction} & TextProps &
  Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'ref'>) => {
  const Arrow = useMemo(() => ArrowIcon(direction), [direction])
  return (
    <Text muted size={1} {...restProps}>
      <Arrow />
    </Text>
  )
}
