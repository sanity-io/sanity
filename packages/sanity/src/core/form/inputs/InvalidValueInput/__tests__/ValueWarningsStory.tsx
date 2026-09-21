import {defineField, defineType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DefaultPreview} from '../../../../components/previews/general/DefaultPreview'
import {type RenderPreviewCallback} from '../../../types/renderCallback'
import {UnknownFields} from '../../ObjectInput/UnknownFields'
import {InvalidValueInput} from '../InvalidValueInput'
import {UntypedValueInput} from '../UntypedValueInput'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'article',
    title: 'Article',
    fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
  }),
]

const renderPreview: RenderPreviewCallback = () => <DefaultPreview title="Unknown reference" />

/**
 * Chromatic sentinel for invalid, untyped, and unknown-value warnings. All
 * values are fixed fixtures and the destructive actions remain untouched.
 */
export function ValueWarningsStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <Card padding={4} style={{maxWidth: 560}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              invalid primitive value
            </Text>
            <InvalidValueInput
              actualType="number"
              onChange={noop}
              validTypes={['string']}
              value={42}
            />
          </Stack>

          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              object without a type
            </Text>
            <UntypedValueInput
              onChange={noop}
              validTypes={['article']}
              value={{title: 'Untyped article'}}
            />
          </Stack>

          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              unknown object fields
            </Text>
            <UnknownFields
              fieldNames={['legacyTitle', 'legacyAuthor']}
              onChange={noop}
              renderPreview={renderPreview}
              value={{
                legacyTitle: 'Old title',
                legacyAuthor: {_type: 'reference', _ref: 'author-1'},
              }}
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
