import {Card, Flex, Text} from '@sanity/ui'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {setOverride, useOption} from './store'

/**
 * TEMPORARY (22 Oct): Faheem picks the T3 list mark between A (v1, the versions icon with a badge on every row) and B (the contained tile,
 * only where there is more). The Handoff Studio is otherwise one fixed design; `c3` is its one adjustable component (options/registry.ts,
 * `adjustable`). Remove this file, its mount in FloatingOptions.tsx and `adjustable` once the option is decided.
 */
const CHOICES = [
  {id: 'a', label: 'A v1'},
  {id: 'f', label: 'B tile'},
] as const

export function T3Switch() {
  const current = useOption('c3')
  return (
    <Card
      border
      data-testid="t3-switch"
      padding={2}
      radius={3}
      shadow={2}
      style={{position: 'fixed', left: 12, bottom: 12, zIndex: 300}}
    >
      <Flex align="center" gap={2}>
        <Text muted size={1}>
          Temporary · T3 list mark
        </Text>
        {CHOICES.map((choice) => (
          <Button
            data-testid={`t3-switch-${choice.id}`}
            key={choice.id}
            mode={current === choice.id ? 'default' : 'ghost'}
            onClick={() => setOverride('c3', choice.id)}
            selected={current === choice.id}
            text={choice.label}
            tone={current === choice.id ? 'primary' : 'default'}
            tooltipProps={null}
          />
        ))}
      </Flex>
    </Card>
  )
}
