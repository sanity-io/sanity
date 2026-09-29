import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {route, RouterProvider, type RouterState} from 'sanity/router'
import {expect, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {SCHEDULES_TOOL_NAME} from '../../schedules/plugin'
import {ReleasesToolLink} from '../ReleasesToolLink'

// The link targets `{tool: 'releases', releases: undefined}`, so the router needs
// the studio's `/:tool` route with a scope for the tool's own state to encode it;
// the mock studio's router only has the intent routes.
const toolRouter = route.create('/', [
  route.intents('/intent'),
  route.create('/:tool', (params) =>
    params.tool === SCHEDULES_TOOL_NAME
      ? route.scope(SCHEDULES_TOOL_NAME, '/', [route.create('/:releaseId')])
      : route.create('/'),
  ),
])

function ToolRouter(props: {children: ReactNode; state: RouterState}) {
  const {children, state} = props
  return (
    <RouterProvider router={toolRouter} state={state} onNavigate={noop}>
      {children}
    </RouterProvider>
  )
}

/**
 * The navbar link to the releases tool: an oversized bleed button showing the
 * selected perspective's release avatar (drafts here). Selected when the
 * router is on the releases tool. The error dot needs a failing releases
 * store and is not rendered by these stories.
 */
const meta = {
  title: 'Core/Perspective/Releases Tool Link',
  component: ReleasesToolLink,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Card padding={3} style={{display: 'inline-block'}}>
          <Story />
        </Card>
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof ReleasesToolLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ToolRouter state={{tool: 'structure'}}>
      <ReleasesToolLink />
    </ToolRouter>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const link = await canvas.findByTestId('releases-tool-link')
    await waitFor(() => expect(link).toBeVisible())
    await expect(link).toHaveAttribute('href', `/${SCHEDULES_TOOL_NAME}`)
    await expect(link).not.toHaveAttribute('data-selected')
  },
}

export const Selected: Story = {
  render: () => (
    <ToolRouter state={{tool: SCHEDULES_TOOL_NAME}}>
      <ReleasesToolLink />
    </ToolRouter>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const link = await canvas.findByTestId('releases-tool-link')
    await waitFor(() => expect(link).toBeVisible())
    await expect(link).toHaveAttribute('data-selected')
  },
}
