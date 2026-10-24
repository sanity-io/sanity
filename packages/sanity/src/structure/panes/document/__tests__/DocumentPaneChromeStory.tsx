import {JsonInspector} from '@rexxars/react-json-inspector'
import {defineField, defineType, isObjectSchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {LocaleProvider, useSchema} from 'sanity'
import {Box, Flex, Text as Text5, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {
  ChevronWrapper,
  CrossDatasetReferencesDetails,
  CrossDatasetReferencesSummary,
  DocumentIdFlex,
  OtherReferenceCount,
  Table,
} from '../../../components/confirmDeleteDialog/ConfirmDeleteDialogBody.styles'
import {PaneLayout} from '../../../components/pane/PaneLayout'
import {DocumentLayoutError} from '../document-layout/DocumentLayoutError'
import {DocumentInspectorErrorBoundary} from '../documentInspector/DocumentInspectorErrorBoundary'
import {FormHeader} from '../documentPanel/documentViews/FormHeader'
import {isExpanded, toggleExpanded} from '../inspectDialog/helpers'
import {JSONInspectorWrapper} from '../inspectDialog/InspectDialog.styles'
import {Search} from '../inspectDialog/Search'
import {PopoverDialog} from '../statusBar/dialogs/PopoverDialog'
import {AnimatedStatusIcon} from '../statusBar/DocumentStatusPulse/AnimatedStatusIcon'
import {DocumentStatusPulse} from '../statusBar/DocumentStatusPulse/DocumentStatusPulse'
import {ListWrapper, Root as TimelineRoot, StackWrapper} from '../timeline/timeline.styled'
import {TimelineItem} from '../timeline/timelineItem'
import {UserAvatarStack} from '../timeline/userAvatarStack'
import {type NonPublishChunk, type PublishChunk} from '../timeline/utils'

const noop = () => undefined

export const documentPaneChromeSchemaTypes = [
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    description: 'A long-form piece of writing',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
  defineType({
    name: 'siteSettings',
    title: 'Site settings',
    type: 'document',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

/**
 * `TimelineItem` renders its timestamp as relative time with no reference
 * instant, so the fixture is anchored two hours before module load and the
 * text ("2h") is stable for the life of the page.
 */
const REFERRING_DOCUMENT_ID = 'article-ref'
const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

const EDIT_CHUNK: NonPublishChunk = {
  index: 2,
  id: 'chunk-edit',
  type: 'editDraft',
  start: 2,
  end: 3,
  startTimestamp: TWO_HOURS_AGO,
  endTimestamp: TWO_HOURS_AGO,
  authors: new Set(['doug']),
  draftState: 'present',
  publishedState: 'present',
}

const PUBLISH_CHUNK: PublishChunk = {
  index: 1,
  id: 'chunk-publish',
  type: 'publish',
  start: 1,
  end: 2,
  startTimestamp: TWO_HOURS_AGO,
  endTimestamp: TWO_HOURS_AGO,
  authors: new Set(['doug']),
  draftState: 'missing',
  publishedState: 'present',
  children: ['chunk-edit'],
  collaborators: new Set(['doug']),
}

const INSPECTED_DOCUMENT = {
  _id: 'article-fixture',
  _type: 'article',
  title: 'Document pane chrome',
  tags: ['storybook', 'chromatic'],
  published: true,
  wordCount: 1200,
}

const POPOVER_DIALOG = {
  type: 'popover' as const,
  content: (
    <Box padding={3}>
      <Text size={1}>Popover dialog content</Text>
    </Box>
  ),
  onClose: noop,
}

function ThrowingInspector(): never {
  throw new Error('The inspector failed on purpose')
}

function Section({children, title}: {children: ReactNode; title: string}) {
  return (
    <VStack gap={3}>
      <Text5 muted size={1} weight="medium" as="div" trim={true}>
        {title}
      </Text5>
      {children}
    </VStack>
  )
}

function FormHeaders() {
  const schema = useSchema()
  const article = schema.get('article')
  const siteSettings = schema.get('siteSettings')
  if (!isObjectSchemaType(article) || !isObjectSchemaType(siteSettings)) {
    throw new Error('Expected the article and siteSettings fixture document types')
  }

  return (
    <>
      <FormHeader
        documentId="article-fixture"
        schemaType={article}
        title="Document pane chrome"
        onTitleClick={noop}
      />
      <FormHeader documentId="article-untitled" schemaType={article} />
      <FormHeader documentId="siteSettings" schemaType={siteSettings} title="Site settings" />
    </>
  )
}

function PopoverDialogSection() {
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)

  return (
    <Box paddingTop={6}>
      <Button mode="ghost" ref={setReferenceElement} text="Popover anchor" />
      <PopoverDialog dialog={POPOVER_DIALOG} referenceElement={referenceElement} />
    </Box>
  )
}

/**
 * Harness for the document pane's leaf chrome: the form header in its
 * singleton, titled and untitled forms, the timeline item and avatar stack
 * with the styled timeline wrappers, the document status pulse and its
 * animated icon, the JSON inspector wrapper with its search input, the
 * confirm-delete table primitives, a popover dialog anchored to a button,
 * the unknown-document-type error pane and the inspector error boundary's
 * fallback. The timeline chunks are typed `NonPublishChunk` / `PublishChunk`
 * fixtures authored by the mock workspace's current user, so the avatars
 * render without a user lookup.
 */
export function DocumentPaneChromeStory() {
  return (
    <TestWrapper schemaTypes={documentPaneChromeSchemaTypes}>
      <LocaleProvider>
        <VStack gap={6}>
          {/* First so the anchor stays inside the viewport: floating-ui hides the popover when
              its reference element is clipped, which a tall story's lower sections would be */}
          <Section title="popover dialog">
            <PopoverDialogSection />
          </Section>

          <Section title="form headers">
            <FormHeaders />
          </Section>

          <Section title="timeline items">
            <TimelineRoot $visible>
              <ListWrapper $maxHeight="240px" flexDirection="column">
                <StackWrapper gap={1} padding={2}>
                  <TimelineItem chunk={EDIT_CHUNK} isSelected={false} onSelect={noop} />
                  <TimelineItem
                    chunk={PUBLISH_CHUNK}
                    collaborators={PUBLISH_CHUNK.collaborators}
                    isSelected
                    onSelect={noop}
                  />
                </StackWrapper>
              </ListWrapper>
            </TimelineRoot>
            <UserAvatarStack maxLength={3} userIds={['doug']} size={1} />
          </Section>

          <Section title="document status pulse">
            <Flex alignItems="center" gap={4}>
              <DocumentStatusPulse status="saved" />
              <DocumentStatusPulse status="syncing" />
              <Text size={1}>
                <AnimatedStatusIcon status="changes" />
              </Text>
            </Flex>
          </Section>

          <Section title="json inspector">
            <Card border padding={3} radius={2}>
              <JSONInspectorWrapper>
                <JsonInspector
                  data={INSPECTED_DOCUMENT}
                  isExpanded={isExpanded}
                  onClick={toggleExpanded}
                  search={Search}
                  filterOptions={{ignoreCase: true}}
                />
              </JSONInspectorWrapper>
            </Card>
          </Section>

          <Section title="confirm delete references">
            <Card border radius={2}>
              <Table>
                <thead>
                  <tr>
                    <th>
                      <Text size={1} weight="medium">
                        Document
                      </Text>
                    </th>
                    <th>
                      <Text size={1} weight="medium">
                        Id
                      </Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <Text size={1}>Referring article</Text>
                    </td>
                    <td>
                      <DocumentIdFlex alignItems="center" justifyContent="flex-end">
                        <Text size={1} muted>
                          {REFERRING_DOCUMENT_ID}
                        </Text>
                      </DocumentIdFlex>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <OtherReferenceCount totalCount={5} references={[1, 2]} />
              <CrossDatasetReferencesDetails open>
                <CrossDatasetReferencesSummary>
                  <Flex alignItems="center" padding={3}>
                    <Text size={1}>Cross dataset references</Text>
                    <ChevronWrapper>
                      <Text size={1}>▾</Text>
                    </ChevronWrapper>
                  </Flex>
                </CrossDatasetReferencesSummary>
                <Box padding={3}>
                  <Text size={1} muted>
                    production / blog
                  </Text>
                </Box>
              </CrossDatasetReferencesDetails>
            </Card>
          </Section>

          <Section title="unknown document type">
            <Card border style={{height: 280}}>
              <PaneLayout height="fill">
                <DocumentLayoutError paneKey="unknown-type" documentType="legacyPost" />
              </PaneLayout>
            </Card>
          </Section>

          <Section title="inspector error boundary">
            <Card border style={{height: 240}}>
              <DocumentInspectorErrorBoundary onClose={noop}>
                <ThrowingInspector />
              </DocumentInspectorErrorBoundary>
            </Card>
          </Section>
        </VStack>
      </LocaleProvider>
    </TestWrapper>
  )
}
