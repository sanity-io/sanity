import {type PortableTextBlock} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PopoverContent} from '../PopoverContent'
import {type FreeTrialDialog} from '../types'

const DESCRIPTION: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'body',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'body-span',
        marks: [],
        text: 'You have 5 days left in your trial.',
      },
    ],
    markDefs: [],
  },
]

const PRIMARY_ONLY: FreeTrialDialog = {
  _createdAt: '2024-01-01T00:00:00.000Z',
  _id: 'trial-primary',
  _rev: '1',
  _type: 'dialog',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  ctaButton: {action: 'closeDialog', text: 'Got it'},
  descriptionText: DESCRIPTION,
  dialogType: 'popover',
  headingText: 'Your trial is ending soon',
  id: 'trial-primary',
  image: null,
}

const WITH_SECONDARY: FreeTrialDialog = {
  ...PRIMARY_ONLY,
  _id: 'trial-secondary',
  ctaButton: {action: 'openUrl', text: 'Upgrade', url: 'https://www.sanity.io/pricing'},
  headingText: 'Upgrade to keep publishing',
  id: 'trial-secondary',
  secondaryButton: {text: 'Not now'},
}

const NOOP = () => undefined

/**
 * Chromatic sentinel for the free-trial popover after the ui5 Flex/Box
 * migration. Single vs dual action rows pair Flex justification with
 * heading Box padding — a mix TypeScript will not catch. No image (avoids
 * network). Copy is a fixture.
 */
const meta = {
  title: 'Studio/Free Trial Popover',
  component: PopoverContent,
} satisfies Meta<typeof PopoverContent>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {content: PRIMARY_ONLY, handleClose: NOOP, handleOpenNext: NOOP},
  render: () => (
    <Card padding={4} style={{maxWidth: 360}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            primary only
          </Text>
          <PopoverContent content={PRIMARY_ONLY} handleClose={NOOP} handleOpenNext={NOOP} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            primary and secondary
          </Text>
          <PopoverContent content={WITH_SECONDARY} handleClose={NOOP} handleOpenNext={NOOP} />
        </Stack>
      </Stack>
    </Card>
  ),
  // Both CTAs set autoFocus; React commits them in tree order so the last one
  // wins deterministically. Blur it so the snapshot stays focus-neutral.
  play: () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
