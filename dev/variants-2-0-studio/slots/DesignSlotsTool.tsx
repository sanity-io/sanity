import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {Box, Heading, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {type Tool, type ToolMenuProps} from 'sanity'

import {InventoryTable, DefinitionsTool, ReleasesTool} from '../c5/InventoryTable'
import {OptionSlot} from '../options/OptionSlot'
import {COMPONENTS} from '../options/registry'
import {STOCK_OPTION, useOption, useOptionState} from '../options/store'

/** Components whose V1 is only a slot for now; they live in this tool. */
const SLOT_ONLY = ['c5', 'c6', 'c8']

// Live renderers per option (C5 table, C6 definition lens, C8 release lens).
const LIVE: Record<string, Record<string, ReactNode>> = {
  c5: {a: <InventoryTable option="a" />, b: <InventoryTable option="b" />},
  c6: {a: <DefinitionsTool />},
  c8: {a: <ReleasesTool />},
}

function DesignSlots() {
  const stock = useOption('c5') === STOCK_OPTION
  return (
    <Box padding={4} style={{height: '100%', overflow: 'auto'}}>
      <Stack gap={4} style={{maxWidth: 1280}}>
        <Stack gap={2}>
          <Heading size={2}>Design slots</Heading>
          <Text muted size={1}>
            Every handoff component has an A/B/C/Final slot. These have no UI yet; the Config panel picks the option
            each one shows. C1 and C3 are in the navbar and the document list, C2 and C7 in the document pane, C4 in
            the document inspector.
          </Text>
        </Stack>
        {stock ? (
          <Text muted size={1}>Stock is on: no design slots are rendered.</Text>
        ) : (
          SLOT_ONLY.map((id) => (
            <Stack gap={2} key={id}>
              <Text size={1} weight="semibold">
                {COMPONENTS.find((c) => c.id === id)?.title}
              </Text>
              <OptionSlot component={id} options={LIVE[id]} />
            </Stack>
          ))
        )}
        <Stack gap={2}>
          <Text muted size={0}>Where each component shows up</Text>
          {COMPONENTS.map((component) => (
            <Text key={component.id} size={1}>
              {component.title}: {component.where ?? 'in the navbar or the document list'}
            </Text>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

export const designSlotsTool: Tool = {
  name: 'design-slots',
  title: 'Design slots',
  icon: ThLargeIcon,
  component: DesignSlots,
}

/** Hides the Design slots tool from the nav when the master Stock switch is on, so the top bar is stock. */
export function ToolMenuWithSlots(props: ToolMenuProps) {
  const {global} = useOptionState()
  const tools = global === 'stock' ? props.tools.filter((tool) => tool.name !== 'design-slots') : props.tools
  return props.renderDefault({...props, tools})
}
