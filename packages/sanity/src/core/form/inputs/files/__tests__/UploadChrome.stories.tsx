import {type Meta, type StoryObj} from '@storybook/react-vite'

import {UploadChromeStory} from './UploadChromeStory'

/**
 * Chromatic sentinel: upload placeholders (row, browse-only, collapsed
 * column), placeholder text states, upload progress, file asset rows and the
 * image access-restriction overlay after the ui5 Flex migration. Studio i18n
 * only; no network.
 */
const meta = {
  title: 'Inputs/Upload Chrome',
  component: UploadChromeStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
  // The image preview settles on its error overlay after the broken image src fails to decode.
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof UploadChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
