import {Card, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {getComponent} from './registry'
import {useOption} from './store'

interface OptionSlotProps {
  /** Registry id, e.g. 'c3'. */
  component: string
  /** One renderer per option id. A missing entry shows a "not built yet" placeholder. */
  options: Record<string, ReactNode>
}

// Every design surface mounts through a slot, so the toolbar and the control panel decide which
// option renders without the surface knowing about them.
export function OptionSlot({component, options}: OptionSlotProps) {
  const active = useOption(component)
  const def = getComponent(component)
  const content = options[active]

  if (content !== undefined) return <>{content}</>

  const option = def?.options.find((candidate) => candidate.id === active)
  return (
    <Card border padding={3} radius={2} tone="transparent">
      <Stack gap={2}>
        <Text size={1} weight="medium">
          {def?.title ?? component}: option {active.toUpperCase()} is not built yet
        </Text>
        {option && <Text size={1} muted>{option.label}. {option.summary}</Text>}
        <Text as="code" muted size={0}>{`<OptionSlot component="${component}" options={{${active}: …}} />`}</Text>
      </Stack>
    </Card>
  )
}
