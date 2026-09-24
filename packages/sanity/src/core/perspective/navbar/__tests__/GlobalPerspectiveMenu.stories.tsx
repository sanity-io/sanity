import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {GlobalPerspectiveMenu} from '../GlobalPerspectiveMenu'

/**
 * The navbar's perspective menu: the chevron trigger and, once opened, the
 * releases menu with its sticky system perspectives (Published, Drafts) at the
 * top and the releases-tool actions at the bottom. Chromatic sentinel for the
 * menu's zero-gap override on the `@sanity/ui` Menu stack, which is what keeps
 * the sticky cards flush against the scrollable release sections.
 *
 * Rendered inside `TestWrapper`: the releases store settles to an empty,
 * loaded list against the mock client, so no release sections render and the
 * menu shows only the system perspectives and the actions.
 */
const meta = {
  title: 'Perspective/Global Perspective Menu',
  component: GlobalPerspectiveMenu,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Flex alignItems="flex-start" justifyContent="flex-end" style={{minHeight: 360}}>
          <Story />
        </Flex>
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof GlobalPerspectiveMenu>

export default meta
type Story = StoryObj<typeof meta>

/** Drafts perspective selected; `play` opens the menu so the snapshot shows it. */
export const Open: Story = {
  args: {
    selectedPerspectiveName: undefined,
    areReleasesEnabled: true,
  },
  parameters: {chromatic: {delay: 300}},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, so the trigger
    // is not in the canvas on the first frame.
    const trigger = await canvas.findByTestId('global-perspective-menu-button', undefined, {
      timeout: 5000,
    })
    await userEvent.click(trigger)
    const body = within(document.body)
    await waitFor(() => expect(body.getByTestId('release-menu')).toBeVisible(), {timeout: 3000})
    await waitFor(() => expect(body.getByText('Published')).toBeVisible(), {timeout: 3000})
  },
}
