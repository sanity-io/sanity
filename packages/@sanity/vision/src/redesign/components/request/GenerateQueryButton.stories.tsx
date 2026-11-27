import {Card, Flex, Label, Stack} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {Tooltip} from '@sanity/ui/tooltip'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {fn, expect, screen, userEvent, within} from 'storybook/test'
import {Text} from 'ui5'

import {GenerateQueryButton} from './GenerateQueryButton'

/**
 * Labelled Agent Actions entry point under the query in Vision's query editor. The sparkles
 * icon stays and twinkles now and then, with "Generate" written out beside it.
 * The twinkle is switched off under `prefers-reduced-motion`.
 */
const meta = {
  title: 'Vision/Generate Query Button',
  component: GenerateQueryButton,
  args: {
    text: 'Generate',
    onClick: fn(),
  },
} satisfies Meta<typeof GenerateQueryButton>

export default meta
type Story = StoryObj<typeof meta>

function QueryEndChrome({action}: {action: ReactNode}) {
  return (
    <Card border padding={4} radius={2} style={{maxWidth: 480}}>
      <Stack gap={3}>
        <Label muted size={1}>
          Query
        </Label>
        <Code size={1}>{'*[_type == "author"]'}</Code>
        <Flex>{action}</Flex>
      </Stack>
    </Card>
  )
}

/** Resting control as it sits in the query editor label row. */
export const Default: Story = {
  play: async ({args, canvasElement}) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', {name: 'Generate'})
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalled()
  },
}

/**
 * In-context: under the query's last line, where the control lives, lined up with the
 * query text.
 */
export const UnderQuery: Story = {
  render: (args) => <QueryEndChrome action={<GenerateQueryButton {...args} />} />,
}

/**
 * Wrapped in a tooltip, as the AI credits note wraps it under the query: the
 * tooltip has to reach the underlying button to open on hover.
 */
export const InTooltip: Story = {
  render: (args) => (
    <Tooltip content={<Text size={1}>Uses AI credits</Text>} placement="bottom" portal>
      <GenerateQueryButton {...args} />
    </Tooltip>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.hover(canvas.getByRole('button', {name: 'Generate'}))
    await expect(await screen.findByText('Uses AI credits')).toBeVisible()
  },
}
