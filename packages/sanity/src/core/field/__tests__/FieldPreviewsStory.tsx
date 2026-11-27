import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {DatetimePreview} from '../types/datetime/preview/DatetimePreview'
import {NumberPreview} from '../types/number/preview/NumberPreview'
import {SlugPreview} from '../types/slug/preview/SlugPreview'
import {StringPreview} from '../types/string/preview/StringPreview'

// Previews only render `value`; schemaType is unused at runtime.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- story fixture, not a real schema
const UNUSED_SCHEMA_TYPE = {name: 'unknown'} as never

// Date-only previews read `name` / `options.dateFormat` (and walk `type` for
// aliases). Incomplete on purpose — not a compiled schema.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- story fixture, not a real schema
const DATE_SCHEMA = {name: 'date'} as never
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- story fixture, not a real schema
const DATE_CUSTOM_SCHEMA = {name: 'date', options: {dateFormat: 'MMMM D, YYYY'}} as never
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- story fixture, not a real schema
const DATE_EXTENDS_SCHEMA = {
  name: 'anniversary',
  type: {name: 'date'},
  options: {dateFormat: 'DD/MM/YYYY'},
} as never

/**
 * Chromatic sentinel for ui5 Box padding on review-changes field previews
 * (string / number / slug / date-only datetime). Shared with Storybook via a
 * thin CSF wrapper. Datetime (with a time) is omitted — it formats in the
 * local timezone and would churn across environments.
 */
export function FieldPreviewsStory() {
  return (
    <Card padding={4} style={{maxWidth: 420}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            string
          </Text>
          <StringPreview schemaType={UNUSED_SCHEMA_TYPE} value="A short string value" />
          <StringPreview
            schemaType={UNUSED_SCHEMA_TYPE}
            value="A wrapped string that should break across lines because it is long enough to overflow the preview box padding."
          />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            number
          </Text>
          <NumberPreview schemaType={UNUSED_SCHEMA_TYPE} value="1280" />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            slug
          </Text>
          <SlugPreview
            schemaType={UNUSED_SCHEMA_TYPE}
            value={{_type: 'slug', current: 'article-title'}}
          />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            date
          </Text>
          <DatetimePreview schemaType={DATE_SCHEMA} value="2026-09-20" />
          <DatetimePreview schemaType={DATE_CUSTOM_SCHEMA} value="2026-09-20" />
          <DatetimePreview schemaType={DATE_EXTENDS_SCHEMA} value="2026-09-20" />
        </VStack>
      </VStack>
    </Card>
  )
}
