import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {FormStyledPrimitivesStory} from './FormStyledPrimitivesStory'

/**
 * Styled-components and `@sanity/ui` sentinel for the form's smaller styled
 * primitives: the activate-on-focus overlay, the Portable Text compositor
 * root and expanded layer, the full-height change indicator, the image tool
 * hotspot and crop SVG styles, the unknown value marker, the field group tabs,
 * the reference link card and the incompatible array item card.
 */
const meta = {
  title: 'Form/Styled Primitives',
  component: FormStyledPrimitivesStory,
} satisfies Meta<typeof FormStyledPrimitivesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByText('Inactive editor content')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('Focused compositor')).toBeVisible()
    await expect(body.getByText('Expanded layer')).toBeVisible()
    await expect(body.getByText('Changed block')).toBeVisible()
    await expect(body.getByText('192×128')).toBeVisible()
    await expect(body.getAllByTestId('unknown-value')).toHaveLength(2)
    await expect(body.getByRole('tab', {name: 'Content'})).toBeVisible()
    await expect(body.getByRole('tab', {name: 'SEO'})).toBeDisabled()
    await expect(body.getByText('Linked reference preview')).toBeVisible()
    await expect(body.getByText('Linked reference preview').closest('a')).toHaveAttribute(
      'data-document-id',
      'author-1',
    )
    // Without a resolved document type the card renders as a plain card, not a link.
    await expect(body.queryByText('Reference without a resolved type')?.closest('a')).toBeNull()
    // The item card and its closed popover both carry the prompt.
    await expect(body.getAllByText('legacyBanner').length).toBeGreaterThan(0)
  },
}
