import {Card, Stack, Text} from '@sanity/ui'

import {NumberPreview} from '../types/number/preview/NumberPreview'
import {SlugPreview} from '../types/slug/preview/SlugPreview'
import {StringPreview} from '../types/string/preview/StringPreview'

// Previews only render `value`; schemaType is unused at runtime.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- story fixture, not a real schema
const UNUSED_SCHEMA_TYPE = {name: 'unknown'} as never

/**
 * Chromatic sentinel for ui5 Box padding on review-changes field previews
 * (string / number / slug). Shared with Storybook via a thin CSF wrapper.
 */
export function FieldPreviewsStory() {
  return (
    <Card padding={4} style={{maxWidth: 420}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            string
          </Text>
          <StringPreview schemaType={UNUSED_SCHEMA_TYPE} value="A short string value" />
          <StringPreview
            schemaType={UNUSED_SCHEMA_TYPE}
            value="A wrapped string that should break across lines because it is long enough to overflow the preview box padding."
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            number
          </Text>
          <NumberPreview schemaType={UNUSED_SCHEMA_TYPE} value="1280" />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            slug
          </Text>
          <SlugPreview
            schemaType={UNUSED_SCHEMA_TYPE}
            value={{_type: 'slug', current: 'article-title'}}
          />
        </Stack>
      </Stack>
    </Card>
  )
}
