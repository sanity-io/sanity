import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import noop from 'lodash-es/noop.js'

import {FallbackErrorScreen} from '../FallbackErrorScreen'
import {ImportErrorScreen} from '../ImportErrorScreen'

const FRAME_STYLE = {height: 460}

/** A real stack names bundle chunks and line numbers that differ per build; pin it. */
function fixtureError(message: string): Error {
  const error = new Error(message)
  error.stack = `Error: ${message}\n    at renderTool (studio.js:1:1)\n    at StudioLayout (studio.js:2:2)`
  return error
}

const FALLBACK_ERROR = fixtureError("Cannot read properties of undefined (reading 'title')")
const IMPORT_ERROR = fixtureError('Failed to fetch dynamically imported module: /chunks/tool.js')

/**
 * Chromatic sentinel for the two full-screen error boundaries after the ui5
 * Flex/VStack migration: the uncaught-error fallback and the dynamic-import
 * failure. Heading, copy, and the action row all hang off VStack gaps inside
 * a centered Flex — spacing TypeScript will not catch. Errors carry a pinned
 * stack; the import screen renders without `autoReload` so no countdown runs
 * and nothing reloads the page.
 *
 * Both screens branch on `process.env.NODE_ENV`: the Chromatic capture is a
 * production build, so it shows the fallback's "To report this error"
 * paragraph and omits the critical Code card (message, stack, event ID) that
 * the local Storybook dev server and addon-vitest render. That difference is
 * expected.
 */
const meta = {
  title: 'Studio/Error Screens',
  component: FallbackErrorScreen,
} satisfies Meta<typeof FallbackErrorScreen>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {error: FALLBACK_ERROR, onReset: noop},
  render: () => (
    <Card padding={4}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            fallback (uncaught error, event ID)
          </Text>
          <div style={FRAME_STYLE}>
            <FallbackErrorScreen error={FALLBACK_ERROR} eventId="evt_fixture_1" onReset={noop} />
          </div>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            import error (manual reload)
          </Text>
          <div style={FRAME_STYLE}>
            <ImportErrorScreen error={IMPORT_ERROR} />
          </div>
        </Stack>
      </Stack>
    </Card>
  ),
}
