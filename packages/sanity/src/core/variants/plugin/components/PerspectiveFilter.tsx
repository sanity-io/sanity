import {RemoveIcon} from '@sanity/icons/Remove'
import {Box, Card, Flex, Text, type CardTone} from '@sanity/ui'
import {type ReactNode} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {AnimatedTextWidth} from '../../../perspective/navbar/AnimatedTextWidth'
import {SegmentDivider} from './PerspectiveFilter.css'

interface PerspectiveFilterProps {
  /** Static label rendered before the pill, e.g. "Version" or "Variant". */
  prefix: string
  tone: CardTone
  /** The filter's main control — a single button that opens the filter's menu. */
  children: ReactNode
  /**
   * When set with `removeLabel`, the pill gains a remove segment that clears just this filter.
   * Both must be provided; an icon-only control is not rendered without an accessible label.
   */
  onRemove?: () => void
  /** Tooltip and accessible name for the remove segment. Required when `onRemove` is set. */
  removeLabel?: string
  label?: string
}

/**
 * One labelled filter in the perspective bar: a static prefix followed by a
 * pill. The prefix sits flush against the pill, matching the design.
 *
 * @internal
 */
export function PerspectiveFilter({
  prefix,
  tone,
  children,
  onRemove,
  removeLabel,
  label,
}: PerspectiveFilterProps): React.JSX.Element {
  return (
    <Flex align="center" data-ui="PerspectiveFilter">
      <Box paddingX={2}>
        <Text size={1}>{prefix}</Text>
      </Box>
      <Card tone={tone} radius={2} border>
        <Flex align="center">
          {label ? <AnimatedTextWidth text={label}>{children}</AnimatedTextWidth> : children}
          {onRemove && removeLabel ? (
            <>
              <div className={SegmentDivider} />
              <Button
                aria-label={removeLabel}
                data-testid="perspective-filter-remove"
                icon={RemoveIcon}
                mode="bleed"
                onClick={onRemove}
                tooltipProps={{content: removeLabel}}
              />
            </>
          ) : null}
        </Flex>
      </Card>
    </Flex>
  )
}
