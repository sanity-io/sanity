import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseBannersStory} from '../../../../packages/sanity/src/core/releases/tool/overview/__tests__/ReleaseBannersStory'

/**
 * Reuses the in-package harness: caution banners wrapping ui5 Box around
 * Card tone. Copy is static i18n (no timestamps).
 */
const meta = {
  title: 'Releases/Banners',
  component: ReleaseBannersStory,
} satisfies Meta<typeof ReleaseBannersStory>

export default meta
type Story = StoryObj<typeof meta>

export const CautionBanners: Story = {}
