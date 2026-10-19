import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'

import {getComponent} from '../options/registry'
import {useOption} from '../options/store'

/**
 * What a slot shows until a real V1 exists for the active option: the component, its cover text, where it
 * appears in the studio, and the option's own label, summary and Figma refs.
 */
export function PlaceholderSlot({component}: {component: string}) {
  const active = useOption(component)
  const def = getComponent(component)
  const option = def?.options.find((candidate) => candidate.id === active)

  return (
    <Card border data-testid={`slot-${component}`} padding={3} radius={2} tone="transparent">
      <Stack gap={3}>
        <Flex align="center" gap={2}>
          <Text size={1} weight="semibold">{def?.title ?? component}</Text>
          <Badge fontSize={0} tone="caution">Option {active.toUpperCase()} · not built yet</Badge>
        </Flex>
        {def?.cover && <Text size={1}>{def.cover}</Text>}
        {option && (
          <Text muted size={1}>
            {option.label}. {option.summary}
          </Text>
        )}
        {(def?.scope || def?.pick) && (
          <Text muted size={0}>
            {[def?.scope && `Scope: ${def.scope}`, def?.pick && `Pick: ${def.pick}`].filter(Boolean).join(' · ')}
          </Text>
        )}
        {(def?.where || option?.refs) && (
          <Text muted size={0}>
            {[def?.where, option?.refs].filter(Boolean).join(' · ')}
          </Text>
        )}
      </Stack>
    </Card>
  )
}
