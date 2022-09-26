import {Text, TextProps} from '@sanity/ui'
import React, {createElement} from 'react'
import {ArrowRightIcon, ArrowDownIcon} from '@sanity/icons'

export type FromToArrowDirection = 'down' | 'right'

const arrowComponents = {
  down: ArrowDownIcon,
  right: ArrowRightIcon,
}

export function FromToArrow(
  props: {direction?: FromToArrowDirection} & TextProps &
    Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'ref'>
) {
  const {direction = 'right', ...restProps} = props
  const arrowComponent = arrowComponents[direction]

  return (
    <Text muted size={1} {...restProps}>
      {createElement(arrowComponent)}
    </Text>
  )
}
