import {Flex} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {Button} from '../../../ui-components/button/Button'
import {TooltipOfDisabled} from '../TooltipOfDisabled'

/**
 * A `Tooltip` that still opens over a disabled control. Disabled buttons emit
 * no pointer events, so a tooltip placed directly on one never fires; this
 * wrapper renders its children inside a plain `<div>` that does receive the
 * hover. Note the inverted `disabled` prop: it disables the *tooltip*, not the
 * control, so the idiom at call sites is `disabled={!controlIsDisabled}` (the
 * explanation shows only while the control cannot be used). The `play`
 * function hovers the disabled button so the open tooltip is what gets
 * captured.
 */
const meta = {
  title: 'Studio/Tooltip Of Disabled',
  component: TooltipOfDisabled,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof TooltipOfDisabled>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Flex align="center" justify="center" style={{minHeight: 160}}>
      <TooltipOfDisabled content="You do not have permission to publish" placement="top">
        <Button disabled text="Publish" tone="primary" />
      </TooltipOfDisabled>
    </Flex>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // Hovering the disabled button bubbles `mouseover` up to the wrapper div,
    // which is the element the tooltip actually listens on.
    await userEvent.hover(canvas.getByRole('button', {name: 'Publish'}))
    // The tooltip portals to document.body and opens after the shared delay
    const body = within(document.body)
    await waitFor(
      () => expect(body.getByText('You do not have permission to publish')).toBeVisible(),
      {timeout: 3000},
    )
  },
}
