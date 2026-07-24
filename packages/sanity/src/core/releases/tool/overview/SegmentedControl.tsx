import {Card, Flex} from '@sanity/ui'
import {type ComponentProps} from 'react'

import {Button} from '../../../../ui-components/button/Button'

type ButtonComponentProps = ComponentProps<typeof Button>

/** One option in a {@link SegmentedControl}. Provide `label` for a text option or `icon` for an
 * icon-only option; icon-only options require a `tooltip` (for the hover label and accessibility). */
export interface SegmentedControlItem<T extends string> {
  value: T
  label?: string
  icon?: ButtonComponentProps['icon']
  tooltip?: string
  tone?: ButtonComponentProps['tone']
  disabled?: boolean
  testId?: string
}

/**
 * The overview's one "pick one of N" widget: a bordered, rounded container wrapping equal-weight
 * buttons, selected = `mode="ghost"`, unselected = `mode="bleed"`. Extracted from the cardinality
 * picker so every mutually-exclusive control on the page (kind, timeline zoom, lifecycle) reads as
 * the same cohesive switch rather than a run of loose buttons.
 *
 * @internal
 */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  size = 'default',
  disabled,
  'data-testid': testId,
}: {
  'items': SegmentedControlItem<T>[]
  'value': T
  'onChange': (value: T) => void
  'size'?: 'default' | 'large'
  'disabled'?: boolean
  'data-testid'?: string
}) {
  return (
    <Card radius={3} border padding={1} data-testid={testId}>
      <Flex align="center" gap={1}>
        {items.map((item) => {
          const selected = item.value === value
          const shared = {
            size,
            'mode': selected ? ('ghost' as const) : ('bleed' as const),
            selected,
            'tone': item.tone,
            'disabled': disabled || item.disabled,
            'onClick': () => onChange(item.value),
            'data-testid': item.testId,
          }
          // Text option: tooltip is optional. Icon-only option: the Button union requires
          // `tooltipProps`, so tooltip is expected — also surface it as the accessible label.
          return item.label ? (
            <Button
              key={item.value}
              {...shared}
              text={item.label}
              icon={item.icon}
              tooltipProps={item.tooltip ? {content: item.tooltip} : undefined}
            />
          ) : (
            <Button
              key={item.value}
              {...shared}
              icon={item.icon}
              aria-label={item.tooltip}
              tooltipProps={{content: item.tooltip}}
            />
          )
        })}
      </Flex>
    </Card>
  )
}
