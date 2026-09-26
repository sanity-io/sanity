import {type Meta, type StoryObj} from '@storybook/react-vite'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {tasksUsEnglishLocaleBundle} from '../../../i18n'
import {RemoveTaskDialog} from '../RemoveTaskDialog'

/**
 * The delete-task confirmation dialog: title, body copy in a Stack, and the
 * cancel / critical confirm footer. Props mirror what `useRemoveTask` returns,
 * so no task context is needed; the loading state is omitted (spinner).
 */
const meta = {
  title: 'Tasks/Remove Task Dialog',
  component: RemoveTaskDialog,
  args: {
    showDialog: true,
    removeStatus: 'idle',
    error: null,
    handleCloseDialog: noop,
    handleRemove: noop,
    handleOpenDialog: noop,
  },
  decorators: [
    (Story) => (
      <TestWrapper i18nBundles={[tasksUsEnglishLocaleBundle]} schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof RemoveTaskDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
