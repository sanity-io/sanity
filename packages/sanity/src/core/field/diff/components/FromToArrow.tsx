import {ArrowDownIcon, ArrowRightIcon} from '@sanity/icons'
import {Text, type TextProps} from '@sanity/ui'
import {createElement, type HTMLProps} from 'react'

/** @internal */
export type FromToArrowDirection = 'down' | 'right'

const arrowComponents = {
  down: ArrowDownIcon,
  right: ArrowRightIcon,
}

/** @internal */
export function FromToArrow(
  props: {direction?: FromToArrowDirection} & TextProps &
    Omit<HTMLProps<HTMLDivElement>, 'children' | 'ref'>,
) {
  const {direction = 'right', ...restProps} = props
  const arrowComponent = arrowComponents[direction]

  return (
    <Text muted size={1} {...restProps}>
      {createElement(arrowComponent)}
    </Text>
  )
}
