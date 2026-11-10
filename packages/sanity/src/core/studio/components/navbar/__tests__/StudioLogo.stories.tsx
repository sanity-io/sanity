import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {StudioLogo} from '../StudioLogo'

/**
 * Chromatic sentinel for the default navbar logo slot (`studio.components.logo`
 * fallback): a padded ui5 `Box` around a medium-weight `Text`. The padding and
 * weight are what a Box or Text migration can silently change. Fixture title.
 */
const meta = {
  title: 'Studio/Studio Logo',
  component: StudioLogo,
  // `renderDefault` is the Components API chain; the default logo is the end
  // of that chain and never calls it.
  args: {renderDefault: () => <></>},
} satisfies Meta<typeof StudioLogo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {title: 'Test Studio'},
  render: (args) => (
    <Card padding={2} style={{maxWidth: 240}}>
      <StudioLogo {...args} />
    </Card>
  ),
}
