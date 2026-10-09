import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {HELP_URL, SerializeError} from '../../../structureBuilder/SerializeError'
import {PaneResolutionError} from '../../../structureResolvers/PaneResolutionError'
import {StructureError} from '../StructureError'

const serializeError = new PaneResolutionError({
  message: 'Structure could not be resolved',
  cause: new SerializeError(
    '`title` is required for list items',
    ['root', 'content', 'items'],
    'article',
    'Article',
  ).withHelpUrl(HELP_URL.TITLE_REQUIRED),
})

const runtimeCause = new TypeError("Cannot read properties of undefined (reading 'schemaType')")
// A real stack carries the dev-server origin and chunk hashes; pin it so the
// snapshot does not drift between builds.
runtimeCause.stack = [
  "TypeError: Cannot read properties of undefined (reading 'schemaType')",
  '    at resolveDocumentNode (structure.ts:42:11)',
  '    at child (structure.ts:18:5)',
  '    at resolveIntent (structureResolvers/resolveIntent.ts:77:20)',
].join('\n')

const runtimeError = new PaneResolutionError({
  message: runtimeCause.message,
  cause: runtimeCause,
})

/**
 * Chromatic sentinel for the critical structure error screen: heading over an
 * inherited-tone card with the structure path breadcrumb, the error code
 * block, docs link and reload button (ui5 Box margins). Two shapes: a
 * `SerializeError` from the structure builder (readable message, path and
 * help link, no stack) and a runtime error (formatted stack, no path).
 */
const meta = {
  title: 'Structure/Structure Error',
  component: StructureError,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof StructureError>

export default meta
type Story = StoryObj<typeof meta>

export const SerializeErrorWithPath: Story = {
  args: {error: serializeError},
}

export const RuntimeErrorWithStack: Story = {
  args: {error: runtimeError},
}
