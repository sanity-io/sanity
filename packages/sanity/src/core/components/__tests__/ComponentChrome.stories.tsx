import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ComponentChromeStory} from './ComponentChromeStory'

/**
 * Styled-components and `@sanity/ui` sentinel for the small shared chrome in
 * `core/components`: progress bars, the resizable panel and its handle, the
 * time zone button in both element-query widths, preview media in every
 * layout, document status rows and dots, version icons and the detail back
 * button.
 */
const meta = {
  title: 'Studio/Component Chrome',
  component: ComponentChromeStory,
} satisfies Meta<typeof ComponentChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Resizable to 240px')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('Back to documents')).toBeVisible()
    // Element-query mode renders a small and a large button per wrapper; CSS hides one of them.
    await expect(body.getAllByTestId('timezone-button')).toHaveLength(4)
  },
}
