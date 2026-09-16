import {BoldIcon} from '@sanity/icons/Bold'
import {ItalicIcon} from '@sanity/icons/Italic'
import {LinkIcon} from '@sanity/icons/Link'
import {UnderlineIcon} from '@sanity/icons/Underline'
import {Flex} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {Button} from '../../button/Button'
import {TooltipDelayGroupProvider} from '../TooltipDelayGroupProvider'

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui`
 * TooltipDelayGroupProvider, hard-coding the shared studio delay (400ms open).
 * Wrap a cluster of controls (a formatting toolbar, for example) in the
 * provider: the first tooltip still waits the full open delay, but once one is
 * showing, moving between siblings reveals their tooltips instantly instead of
 * re-incurring the delay per button. The `play` function hovers the first
 * button so the snapshot captures an open grouped tooltip.
 */
const meta = {
  title: 'UI Components/Tooltip Delay Group Provider',
  component: TooltipDelayGroupProvider,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof TooltipDelayGroupProvider>

export default meta
type Story = StoryObj<typeof meta>

const tools = [
  {icon: BoldIcon, label: 'Bold'},
  {icon: ItalicIcon, label: 'Italic'},
  {icon: UnderlineIcon, label: 'Underline'},
  {icon: LinkIcon, label: 'Link'},
]

export const Grouped: Story = {
  render: () => (
    <Flex align="center" justify="center" style={{minHeight: 160}}>
      <TooltipDelayGroupProvider>
        <Flex gap={1}>
          {tools.map(({icon, label}) => (
            <Button
              key={label}
              aria-label={label}
              icon={icon}
              mode="bleed"
              tooltipProps={{content: label}}
            />
          ))}
        </Flex>
      </TooltipDelayGroupProvider>
    </Flex>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.hover(canvas.getByRole('button', {name: 'Bold'}))
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Bold')).toBeVisible(), {timeout: 3000})
  },
}
