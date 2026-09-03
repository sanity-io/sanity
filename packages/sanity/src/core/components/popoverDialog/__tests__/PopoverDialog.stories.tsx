import {type ResponsiveWidthProps, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {PopoverDialog} from '../PopoverDialog'

function PopoverDialogStory(props: {width: ResponsiveWidthProps['width']}) {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(true)
  const [title, setTitle] = useState('Anna Karenina')

  return (
    <Flex align="flex-start" justify="center" paddingTop={4} style={{minHeight: 360}}>
      <Button
        mode="ghost"
        onClick={() => setOpen(true)}
        ref={setReferenceElement}
        text="Edit title"
      />
      {open && referenceElement && (
        <PopoverDialog
          header="Edit title"
          onClose={() => setOpen(false)}
          referenceElement={referenceElement}
          width={props.width}
        >
          <Stack gap={4}>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                Title
              </Text>
              <TextInput onChange={(event) => setTitle(event.currentTarget.value)} value={title} />
            </Stack>
            <Flex gap={2} justify="flex-end">
              <Button mode="bleed" onClick={() => setOpen(false)} text="Cancel" />
              <Button onClick={() => setOpen(false)} text="Save" tone="primary" />
            </Flex>
          </Stack>
        </PopoverDialog>
      )}
    </Flex>
  )
}

/**
 * A popover used as a dialog: portaled, anchored to `referenceElement`, with a
 * sticky header carrying a close button and a `react-focus-lock` trap scoped
 * to the portal (so clicks into sibling panes still work when its contents
 * link out to a reference). It is the surface inline object and reference
 * editing opens beside a field. The dialog is always open once rendered, and
 * by design closes only through the header button or `onClose`: there is no
 * Escape or click-outside handling, because nested dialogs and portals inside
 * it must be able to own those gestures. `width` sets an actual container
 * width (`0` 320px, `1` 640px, `2` 960px), capped at the viewport.
 */
const meta = {
  title: 'Core Components/Popover Dialog',
  component: PopoverDialogStory,
  args: {width: 1},
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof PopoverDialogStory>

export default meta
type Story = StoryObj<typeof meta>

/** Anchored to its trigger at `width={1}`, holding a single field to edit in place. */
export const Default: Story = {}

/** The narrowest preset, `width={0}` (320px). */
export const Narrow: Story = {
  args: {width: 0},
}
