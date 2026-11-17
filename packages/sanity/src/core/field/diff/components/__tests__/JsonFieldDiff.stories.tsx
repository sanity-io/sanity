import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type Annotation, type Diff} from '../../../types'
import {JsonFieldDiff} from '../JsonFieldDiff'

// The schema type is unknown to the diff resolver by definition (that is why
// the JSON fallback renders), so a bare object type stands in for it.
const UNKNOWN_SCHEMA = {
  name: 'legacyMetadata',
  title: 'Legacy metadata',
  jsonType: 'object',
  fields: [],
} as ObjectSchemaType

// Empty annotations leave the diff tooltips without an author or timestamp,
// so nothing time-dependent renders.
const NO_ANNOTATION: Annotation = null

const CHANGED: Diff = diffInput(
  wrap({campaign: 'spring-2024', regions: ['eu', 'us'], budget: 1200}, NO_ANNOTATION),
  wrap({campaign: 'spring-2024', regions: ['eu', 'us', 'apac'], budget: 1500}, NO_ANNOTATION),
)

const ADDED: Diff = diffInput(
  wrap(null, NO_ANNOTATION),
  wrap({campaign: 'summer-2024'}, NO_ANNOTATION),
)

const REMOVED: Diff = diffInput(
  wrap({campaign: 'winter-2023'}, NO_ANNOTATION),
  wrap(null, NO_ANNOTATION),
)

/**
 * Chromatic sentinel for the review-changes JSON fallback used for fields
 * whose schema type is no longer known: the caution notice, the `del` and
 * `ins` diff cards with pretty-printed JSON, and the from-to arrow between
 * them. Rendered for a changed, an added and a removed value.
 */
function JsonFieldDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              changed
            </Text>
            <div data-testid="json-diff-changed">
              <JsonFieldDiff diff={CHANGED} schemaType={UNKNOWN_SCHEMA} />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              added
            </Text>
            <div data-testid="json-diff-added">
              <JsonFieldDiff diff={ADDED} schemaType={UNKNOWN_SCHEMA} />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              removed
            </Text>
            <div data-testid="json-diff-removed">
              <JsonFieldDiff diff={REMOVED} schemaType={UNKNOWN_SCHEMA} />
            </div>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

const meta = {
  title: 'Field/JSON Field Diff',
  component: JsonFieldDiffStory,
} satisfies Meta<typeof JsonFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByTestId('json-diff-changed')).toBeVisible(), {
      timeout: 5000,
    })
    const changedRoot = body.getByTestId('json-diff-changed')
    const addedRoot = body.getByTestId('json-diff-added')
    const removedRoot = body.getByTestId('json-diff-removed')

    // `Code` lazy-loads its syntax highlighter and may split the JSON into
    // token spans once it lands, so assert on the text content of the diff
    // cards and wait for the lazily rendered `code` to be the visible one.
    await waitFor(
      async () => {
        const codes = [changedRoot, addedRoot, removedRoot].flatMap((root) =>
          Array.from(root.querySelectorAll('code')),
        )
        await expect(codes.length).toBeGreaterThanOrEqual(4)
        await Promise.all(codes.map((code) => expect(code).toBeVisible()))
      },
      {timeout: 5000},
    )

    await expect(changedRoot.querySelector('del')).toHaveTextContent('"budget": 1200')
    await expect(changedRoot.querySelector('ins')).toHaveTextContent('"budget": 1500')
    await expect(changedRoot.querySelector('ins')).toHaveTextContent('"apac"')

    await expect(addedRoot.querySelector('ins')).toHaveTextContent('summer-2024')
    await expect(addedRoot.querySelector('del')).toBeNull()

    await expect(removedRoot.querySelector('del')).toHaveTextContent('winter-2023')
    await expect(removedRoot.querySelector('ins')).toBeNull()

    // Every variant shows the unknown-schema caution notice.
    await expect(
      body.getAllByText('This field is not defined in the schema. Values are shown as JSON.'),
    ).toHaveLength(3)
  },
}
