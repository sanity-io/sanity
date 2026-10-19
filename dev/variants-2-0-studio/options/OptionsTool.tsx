import {ControlsIcon} from '@sanity/icons/Controls'
import {Badge, Box, Button, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {type Tool} from 'sanity'

import {COMPONENTS, type OptionStatus} from './registry'
import {resolveOption, setOverride, useOptionState} from './store'

const STATUS_TONE: Record<OptionStatus, 'positive' | 'primary' | 'caution'> = {
  final: 'positive',
  candidate: 'primary',
  exploration: 'caution',
}

function OptionsPanel() {
  const state = useOptionState()

  return (
    <Box padding={4} style={{overflow: 'auto', height: '100%'}}>
      <Stack gap={4} style={{maxWidth: 880}}>
        <Stack gap={2}>
          <Heading size={2}>Variants 2.0 options</Heading>
          <Text muted size={1}>
            The floating control (bottom left) sets one choice for every component. Pick an option here to override a single
            component; "Auto" follows the toolbar.
          </Text>
        </Stack>
        {COMPONENTS.map((component) => {
          const active = resolveOption(component, state)
          const overridden = state.overrides[component.id]
          return (
            <Card border key={component.id} padding={3} radius={2}>
              <Stack gap={3}>
                <Flex align="center" gap={2}>
                  <Text size={1} weight="semibold">{component.title}</Text>
                  {component.final && <Badge tone="positive">final: {component.final.toUpperCase()}</Badge>}
                </Flex>
                <Flex gap={2} wrap="wrap">
                  <Button
                    fontSize={1}
                    mode={overridden ? 'ghost' : 'default'}
                    onClick={() => setOverride(component.id, null)}
                    text="Auto"
                  />
                  {component.options.map((option) => (
                    <Button
                      fontSize={1}
                      key={option.id}
                      mode={overridden === option.id ? 'default' : 'ghost'}
                      onClick={() => setOverride(component.id, option.id)}
                      text={`${option.id.toUpperCase()} · ${option.label}`}
                      tone={overridden === option.id ? 'primary' : 'default'}
                    />
                  ))}
                </Flex>
                <Flex align="center" gap={2}>
                  <Text muted size={1}>Showing {active.toUpperCase()}:</Text>
                  {component.options
                    .filter((option) => option.id === active)
                    .map((option) => (
                      <Flex align="center" gap={2} key={option.id}>
                        <Badge tone={STATUS_TONE[option.status]}>{option.status}</Badge>
                        <Text muted size={1}>{option.summary}</Text>
                      </Flex>
                    ))}
                </Flex>
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}

export const optionsTool: Tool = {
  name: 'variants-2-0',
  title: 'Variants 2.0',
  icon: ControlsIcon,
  component: OptionsPanel,
}
