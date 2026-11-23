import {type ObjectSchemaType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {FormHeader} from '../FormHeader'

const NOOP = () => undefined

const authorType: ObjectSchemaType = {
  name: 'author',
  title: 'Author',
  jsonType: 'object',
  fields: [],
}

const authorTypeWithDescription: ObjectSchemaType = {
  ...authorType,
  description: 'A person who writes books.',
}

/**
 * Chromatic sentinel for the document form header after the mixed ui5
 * Text/Box/PressArea/VStack and Sanity UI Heading/Inline migration.
 * Container queries on the title stack pick heading size 4 / 3 / 2 at
 * 640 / 500 / 360. Untitled is muted; a click handler makes the title a
 * PressArea; a singleton (id equals type name) hides the type label;
 * a schema description renders the info icon without opening the tooltip.
 * Copy is locale-fixture only (no live document).
 */
export function FormHeaderStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              titled, 640
            </Text>
            <div style={{width: 640}}>
              <FormHeader documentId="author-1" schemaType={authorType} title="Ada Lovelace" />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              titled, 500
            </Text>
            <div style={{width: 500}}>
              <FormHeader documentId="author-1" schemaType={authorType} title="Ada Lovelace" />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              titled, 360
            </Text>
            <div style={{width: 360}}>
              <FormHeader documentId="author-1" schemaType={authorType} title="Ada Lovelace" />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              untitled fallback
            </Text>
            <div style={{width: 640}}>
              <FormHeader documentId="author-1" schemaType={authorType} />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              clickable title
            </Text>
            <div style={{width: 640}}>
              <FormHeader
                documentId="author-1"
                onTitleClick={NOOP}
                schemaType={authorType}
                title="Ada Lovelace"
              />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              singleton hides type
            </Text>
            <div style={{width: 640}}>
              <FormHeader documentId="author" schemaType={authorType} title="Site settings" />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              type with description icon
            </Text>
            <div style={{width: 640}}>
              <FormHeader
                documentId="author-1"
                schemaType={authorTypeWithDescription}
                title="Ada Lovelace"
              />
            </div>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
