import {type ObjectSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {FormHeader} from '../FormHeader'

// Only the fields FormHeader reads: `name`, `title`, `description`.
const ARTICLE_TYPE = {
  name: 'article',
  title: 'Article',
  description: 'Long-form editorial content published to the magazine.',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

const SETTINGS_TYPE = {
  name: 'siteSettings',
  title: 'Site settings',
  jsonType: 'object',
  fields: [],
} as unknown as ObjectSchemaType

const TITLE = 'Why structured content outlasts the page it was written for'

/**
 * Chromatic sentinel for the document form header: type label with the
 * description tooltip icon over the heading, the singleton variant that
 * drops the label, and the muted "Untitled" fallback. Rendered at three
 * container widths so each container-query heading size is archived.
 */
export function FormHeaderStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              wide container (heading size 4)
            </Text>
            <div style={{width: 640}}>
              <FormHeader documentId="article-1" schemaType={ARTICLE_TYPE} title={TITLE} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              container ≤ 560px (heading size 3)
            </Text>
            <div style={{width: 500}}>
              <FormHeader documentId="article-1" schemaType={ARTICLE_TYPE} title={TITLE} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              container ≤ 420px (heading size 2)
            </Text>
            <div style={{width: 380}}>
              <FormHeader documentId="article-1" schemaType={ARTICLE_TYPE} title={TITLE} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              singleton (id equals type name, no type label)
            </Text>
            <div style={{width: 640}}>
              <FormHeader
                documentId="siteSettings"
                schemaType={SETTINGS_TYPE}
                title="Site settings"
              />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              no title (muted fallback)
            </Text>
            <div style={{width: 640}}>
              <FormHeader documentId="article-2" schemaType={ARTICLE_TYPE} />
            </div>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
