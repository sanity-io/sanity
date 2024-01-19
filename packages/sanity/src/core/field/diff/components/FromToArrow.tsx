import {Text, TextProps} from '@sanity/ui'
import {HTMLProps, createElement} from 'react'
import {ArrowRightIcon, ArrowDownIcon} from '@sanity/icons'

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
