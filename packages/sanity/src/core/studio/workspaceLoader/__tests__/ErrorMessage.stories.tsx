import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ErrorMessage, type ErrorMessageProps} from '../ErrorMessage'

const PATH: ErrorMessageProps['path'] = [
  {name: 'root', type: 'workspace'},
  {name: 'schema', type: 'schema'},
  {name: 'author', type: 'document'},
]

const ERROR = new Error('Unknown type: author')

/**
 * Chromatic sentinel for workspace-loader config errors after the ui5
 * Flex/Box migration. Heading, critical Code card, and path rows all depend
 * on Flex gap plus Box gutters — a mix TypeScript will not catch. Message
 * and path are fixtures; the stack is omitted (non-deterministic).
 */
const meta = {
  title: 'Studio/Workspace Loader Error',
  component: ErrorMessage,
  args: {error: ERROR, message: ERROR.message, path: PATH},
  decorators: [
    (Story) => (
      <Card padding={4} style={{maxWidth: 520}}>
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof ErrorMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
