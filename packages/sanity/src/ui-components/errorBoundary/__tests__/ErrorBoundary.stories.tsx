import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ErrorBoundary} from '../ErrorBoundary'

function ThrowingField(): never {
  throw new Error("Cannot read properties of undefined (reading 'title')")
}

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui` ErrorBoundary.
 * It routes caught render errors to the workspace `onUncaughtError` config (via
 * the source context, when one is present) and forwards to the `onCatch` prop.
 * On a caught error the underlying boundary swaps its children for a raw
 * `<Code>` dump of the error message. There is no reset API — once caught,
 * recovery requires remounting the boundary (e.g. bumping a React `key`).
 */
const meta = {
  title: 'UI Components/Error Boundary',
  component: ErrorBoundary,
  decorators: [
    (Story) => (
      <Stack gap={3} padding={4} style={{maxWidth: 480}}>
        <Card border padding={3} radius={2}>
          <Text size={1}>A healthy sibling, unaffected by the crash below.</Text>
        </Card>
        <Card border padding={3} radius={2}>
          <Story />
        </Card>
      </Stack>
    ),
  ],
} satisfies Meta<typeof ErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A child that throws during render, next to a sibling that stays alive: the
 * boundary contains the failure to its own subtree and renders the caught
 * fallback (the raw error message) in place of its children.
 */
export const Caught: Story = {
  args: {
    onCatch: () => null,
    children: <ThrowingField />,
  },
}
