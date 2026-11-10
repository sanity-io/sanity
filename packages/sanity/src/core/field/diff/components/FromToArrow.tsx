import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {Box, Icon, type TextAlign} from 'ui5'

/** @internal */
export type FromToArrowDirection = 'down' | 'right'

const arrowComponents = {
  down: ArrowDownIcon,
  right: ArrowRightIcon,
}

/** @internal */
export interface FromToArrowProps {
  direction?: FromToArrowDirection
  align?: TextAlign
}

/** @internal */
export function FromToArrow(props: FromToArrowProps) {
  const {direction = 'right', align} = props
  const ArrowComponent = arrowComponents[direction]
  const icon = <Icon icon={ArrowComponent} size={1} muted />

  if (!align) {
    return icon
  }

  return <Box style={{textAlign: align}}>{icon}</Box>
}
