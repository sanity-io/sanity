import {CommentIcon} from '@sanity/icons/Comment'
import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {DocumentInspectorHeader} from '../DocumentInspectorHeader'

const NOOP = () => undefined

const WRAPPING_TITLE =
  'A wrapping inspector title that is long enough to wrap onto a second line in the header'

/**
 * Chromatic sentinel for the post-migration ui5 inspector header. The title
 * is a wrapping `<Text as="h1">` (no textOverflow), so a long title grows
 * the header taller rather than truncating. The children slot is unused
 * in-repo; covered as public API on `sanity/structure` (plugins can fill
 * it). The actions slot renders before the close button; the disabled
 * action covers an action the caller has made inactive. Titles are fixtures
 * (no live inspector).
 */
export function DocumentInspectorHeaderStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              title only
            </Text>
            <DocumentInspectorHeader
              closeButtonLabel="Close inspector"
              onClose={NOOP}
              title="Validation"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              wrapping title
            </Text>
            <DocumentInspectorHeader
              closeButtonLabel="Close inspector"
              onClose={NOOP}
              title={WRAPPING_TITLE}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              title and actions
            </Text>
            <DocumentInspectorHeader
              actions={
                <>
                  <Button
                    aria-label="Enabled action"
                    icon={CommentIcon}
                    mode="bleed"
                    onClick={NOOP}
                    tooltipProps={{content: 'Enabled action'}}
                  />
                  <Button
                    aria-label="Disabled action"
                    disabled
                    icon={CommentIcon}
                    mode="bleed"
                    onClick={NOOP}
                    tooltipProps={{content: 'Disabled action'}}
                  />
                </>
              }
              closeButtonLabel="Close inspector"
              onClose={NOOP}
              title="Versions"
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              title and slot
            </Text>
            <DocumentInspectorHeader
              closeButtonLabel="Close inspector"
              onClose={NOOP}
              title="Review changes"
            >
              <Card padding={3} tone="transparent">
                <Text muted size={1} as="div" trim={true}>
                  Compare this draft with the published document.
                </Text>
              </Card>
            </DocumentInspectorHeader>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
