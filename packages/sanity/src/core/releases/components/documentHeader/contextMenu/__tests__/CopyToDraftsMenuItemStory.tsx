import {type SchemaTypeDefinition} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {CopyToDraftsMenuItem} from '../CopyToDraftsMenuItem'

const ARTICLE_SCHEMA: SchemaTypeDefinition[] = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', type: 'string'}],
  },
]

/**
 * Chromatic sentinel for the copy-to-drafts menu row: Box padding around
 * the drafts ReleaseAvatar inside a MenuItem. The live-edit / drafts-disabled
 * path renders nothing and is omitted (the CSF `play` asserts the row is
 * present). Grid harness for the co-located Storybook CSF file.
 */
export function CopyToDraftsMenuItemStory() {
  return (
    <TestWrapper schemaTypes={ARTICLE_SCHEMA}>
      <Card padding={4} style={{maxWidth: 320}}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            copy version to drafts
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <Menu>
              <CopyToDraftsMenuItem
                documentType="article"
                fromRelease="rActive"
                onClick={() => Promise.resolve()}
              />
            </Menu>
          </Card>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
