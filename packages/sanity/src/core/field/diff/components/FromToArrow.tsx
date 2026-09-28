import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {type HTMLProps} from 'react'
import {Text, type TextProps} from 'ui5'

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
  const ArrowComponent = arrowComponents[direction]

  return (
    <Text muted size={1} {...restProps} as="div" trim={true}>
      <ArrowComponent />
    </Text>
  )
}
