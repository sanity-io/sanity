import {PackageIcon} from '@sanity/icons/Package'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {Box, Heading, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {type Tool, type ToolMenuProps} from 'sanity'

import {InventoryTable} from '../c5/InventoryTable'
import {OptionSlot} from '../options/OptionSlot'
import {COMPONENTS} from '../options/registry'
import {STOCK_OPTION, useOption, useOptionState} from '../options/store'

/** C5 lives here and in the Inventory tool. C6 is the shipped Variants tool (/variants) and C8 the shipped Releases tool (/releases), extended. */
const SLOT_ONLY = ['c5']

// Live renderers per option (C5 table, C6 definition lens, C8 release lens).
const LIVE: Record<string, Record<string, ReactNode>> = {
  c5: {a: <InventoryTable option="a" />, b: <InventoryTable option="b" />},
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

/** One navbar tool per table component, so none of them needs the Design slots tool to be found. */
function SlotTool({component}: {component: 'c5'}) {
  const stock = useOption(component) === STOCK_OPTION
  const title = COMPONENTS.find((c) => c.id === component)?.title
  return (
    <Box padding={4} style={{height: '100%', overflow: 'auto'}}>
      <Stack gap={3} style={{maxWidth: 1280}}>
        <Heading size={2}>{title}</Heading>
        {stock ? <Text muted size={1}>Stock is on: this design is not rendered.</Text> : <OptionSlot component={component} options={LIVE[component]} />}
      </Stack>
    </Box>
  )
}

export const inventoryTool: Tool = {
  name: 'inventory',
  title: 'Inventory',
  icon: PackageIcon,
  component: () => <SlotTool component="c5" />,
}

/** Tools that belong to the designs: hidden when the master Stock switch is on. */
const DESIGN_TOOLS = new Set(['design-slots', 'inventory'])

export const designSlotsTool: Tool = {
  name: 'design-slots',
  title: 'Design slots',
  icon: ThLargeIcon,
  component: DesignSlots,
}

/** Hides the Design slots tool from the nav when the master Stock switch is on, so the top bar is stock. */
export function ToolMenuWithSlots(props: ToolMenuProps) {
  const {global} = useOptionState()
  const tools = global === 'stock' ? props.tools.filter((tool) => !DESIGN_TOOLS.has(tool.name)) : props.tools
  return props.renderDefault({...props, tools})
}
