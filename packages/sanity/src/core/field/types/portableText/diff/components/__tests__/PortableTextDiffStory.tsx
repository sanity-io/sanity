import {diffInput, wrap} from '@sanity/diff'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {type ObjectSchemaType, type PortableTextChild, type PortableTextObject} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {DiffContext} from 'sanity/_singletons'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../../../../test/browser/TestWrapper'
import {type ObjectDiff} from '../../../../../types'
import {Annotation} from '../Annotation'
import {Decorator} from '../Decorator'
import {InlineObject} from '../InlineObject'
import {InlineBox, InlineText, PreviewContainer} from '../styledComponents'

const annotation = {_key: 'annotation', _type: 'unknownAnnotation'} as PortableTextChild
const inlineObject = {_key: 'inline-object', _type: 'unknownInlineObject'} as PortableTextObject
const changeAnnotation = {author: 'grrm', timestamp: '2024-01-01T00:00:00.000Z'}
const linkSchema = {
  fields: [{name: 'href', type: {jsonType: 'string', name: 'string'}}],
  jsonType: 'object',
  name: 'link',
  title: 'Link',
} as unknown as ObjectSchemaType
const linkObject = {
  _key: 'link',
  _type: 'link',
  href: 'https://www.sanity.io',
} as PortableTextObject
const changedDiff = diffInput(
  wrap({href: 'https://example.com'}, changeAnnotation),
  wrap({href: 'https://www.sanity.io'}, changeAnnotation),
) as ObjectDiff
const removedDiff = diffInput(
  wrap({href: 'https://example.com'}, changeAnnotation),
  wrap(null, changeAnnotation),
) as ObjectDiff

/**
 * Chromatic sentinel for Portable Text diff decorators, annotation and inline-object chrome.
 * The unknown-schema states are intentional deterministic fallbacks; the changed preview below
 * pins the inline layout and chevron styling shared by populated diff previews.
 */
export function PortableTextDiffStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 560}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              decorators
            </Text>
            <Flex alignItems="center" flexWrap="wrap" gap={3}>
              <Decorator mark="strong">
                <span>Strong</span>
              </Decorator>
              <Decorator mark="em">
                <span>Emphasis</span>
              </Decorator>
              <Decorator mark="underline">
                <span>Underline</span>
              </Decorator>
              <Decorator mark="strike-through">
                <span>Removed</span>
              </Decorator>
              <Decorator mark="code">
                <span>const value = true</span>
              </Decorator>
            </Flex>
          </Stack>

          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              annotation and inline object fallbacks
            </Text>
            <Annotation object={annotation} path={[{_key: 'block'}]}>
              Annotated text
            </Annotation>
            <InlineObject object={inlineObject} path={[{_key: 'block'}]} />
          </Stack>

          <DiffContext.Provider value={{path: ['body', {_key: 'link'}]}}>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                changed and removed annotation states
              </Text>
              <Annotation
                diff={changedDiff}
                object={linkObject}
                path={[{_key: 'block'}]}
                schemaType={linkSchema}
              >
                Changed link
              </Annotation>
              <Annotation
                diff={removedDiff}
                object={linkObject}
                path={[{_key: 'block'}]}
                schemaType={linkSchema}
              >
                Removed link
              </Annotation>
              <InlineObject
                diff={changedDiff}
                object={linkObject}
                path={[{_key: 'link'}]}
                schemaType={linkSchema}
              />
              <InlineObject
                diff={removedDiff}
                object={linkObject}
                path={[{_key: 'link'}]}
                schemaType={linkSchema}
              />
            </Stack>
          </DiffContext.Provider>

          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              changed inline preview chrome
            </Text>
            <PreviewContainer>
              <InlineBox>
                <Text size={1}>Linked annotation</Text>
                <Flex alignItems="center" paddingX={1}>
                  <InlineText size={0}>
                    <ChevronDownIcon />
                  </InlineText>
                </Flex>
              </InlineBox>
            </PreviewContainer>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
