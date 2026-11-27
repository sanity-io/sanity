import {Card} from '@sanity/ui'
import {DocumentPaneContext} from 'sanity/_singletons'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type DocumentPaneContextValue} from '../../../panes/document/DocumentPaneContext'
import {IncomingReferencesDecoration} from '../IncomingReferencesDecoration'
import {IncomingReferencesList} from '../IncomingReferencesList'

const PANE = {
  documentId: 'author-ada',
  documentType: 'author',
} as DocumentPaneContextValue

/**
 * Chromatic sentinel for incoming-references field chrome after the ui5
 * Text/Flex migration: the titled decoration (label + description) and the
 * critical "types not defined" card. No live references, no search.
 * Shared with Storybook via a thin CSF wrapper.
 */
export function IncomingReferencesChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DocumentPaneContext value={PANE}>
        <Card padding={4} style={{maxWidth: 420}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                titled field, types missing
              </Text>
              <IncomingReferencesDecoration
                name="relatedPosts"
                title="Related posts"
                description="Documents that point at this author."
                types={[]}
              />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                startCase name, types missing
              </Text>
              <IncomingReferencesDecoration name="citedBy" types={[]} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                list only
              </Text>
              <IncomingReferencesList name="relatedPosts" types={[]} />
            </VStack>
          </VStack>
        </Card>
      </DocumentPaneContext>
    </TestWrapper>
  )
}
