// A local copy of core's PerspectiveFilter, which main removed when it moved the variants selector into the navbar (#15635,
// 40cd3e8098). The compare exploration's "single" mode draws the shipped bar with it; kept here so that mode still renders.
import {RemoveIcon} from '@sanity/icons/Remove'
import {Box, Card, type CardTone, Flex, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {AnimatedTextWidth} from '../../../../packages/sanity/src/core/perspective/navbar/AnimatedTextWidth'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'

interface PerspectiveFilterProps {
  /** Static label rendered before the pill, e.g. "Version" or "Variant". */
  prefix: string
  tone: CardTone
  /** The filter's main control: a single button that opens the filter's menu. */
  children: ReactNode
  /** When set with `removeLabel`, the pill gains a remove segment that clears just this filter. */
  onRemove?: () => void
  /** Tooltip and accessible name for the remove segment. */
  removeLabel?: string
  label?: string
}

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
              <div
                style={{
                  alignSelf: 'stretch',
                  backgroundColor: 'var(--card-border-color)',
                  width: 1,
                }}
              />
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
