import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DialogBreadcrumbsStory} from './DialogBreadcrumbsStory'

/**
 * Chromatic sentinel: dialog and presentation breadcrumb crumbs after the
 * ui5 Box / Flex / Text migration. Muted vs selected weight, index Badge,
 * capitalize, truncation, and the slash separator. Fixture titles only.
 */
const meta = {
  title: 'Form/Dialog Breadcrumbs',
  component: DialogBreadcrumbsStory,
} satisfies Meta<typeof DialogBreadcrumbsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
