import {type PortableTextBlock} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {CommentsListItemReferencedValue} from '../CommentsListItemReferencedValue'

const QUOTE: PortableTextBlock[] = [
  {
    _key: 'quote',
    _type: 'block',
    children: [{_key: 'span', _type: 'span', marks: [], text: 'The referenced paragraph'}],
    markDefs: [],
    style: 'normal',
  },
]

/**
 * Chromatic sentinel for the ui5 Box quote (referenced vs missing). Shared
 * with Storybook via a thin CSF wrapper in `dev/storybook`.
 */
export function CommentsListItemReferencedValueStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              referenced
            </Text>
            <CommentsListItemReferencedValue hasReferencedValue value={QUOTE} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              missing referenced value
            </Text>
            <CommentsListItemReferencedValue hasReferencedValue={false} value={QUOTE} />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
