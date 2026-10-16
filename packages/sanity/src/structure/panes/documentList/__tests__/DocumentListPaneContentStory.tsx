import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ComponentProps, type ReactNode} from 'react'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {DocumentListPaneContent} from '../DocumentListPaneContent'

const BASE_PROPS: ComponentProps<typeof DocumentListPaneContent> = {
  error: null,
  filterIsSimpleTypeConstraint: true,
  hasSearchQuery: false,
  isConnected: true,
  isLazyLoading: false,
  isLoading: false,
  canRetry: false,
  items: [],
  onEndReached: noop,
  paneTitle: 'Articles',
  searchInputElement: null,
  showIcons: true,
}

/**
 * `PaneContent` is a flex child, so give each state a column flex box of
 * fixed height for the vertically centered messages to lay out in.
 */
function State({label, children}: {label: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      <Card border radius={2} style={{height: 220, display: 'flex', flexDirection: 'column'}}>
        {children}
      </Card>
    </Stack>
  )
}

/**
 * Chromatic sentinel for the document list pane's non-list states after the
 * ui5 Flex/Box migration: the three centered empty messages and the fetch
 * error layout (heading, message, retry/copy actions, retry status line).
 * The error message body is dev-only detail: local Storybook and addon-vitest
 * render the `Error: <code>` line, the production Chromatic build renders
 * the generic copy. The populated list is store-backed (previews) and is not
 * rendered here.
 */
export function DocumentListPaneContentStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <State label="no documents of this type">
            <DocumentListPaneContent {...BASE_PROPS} />
          </State>
          <State label="no matching documents (custom filter)">
            <DocumentListPaneContent {...BASE_PROPS} filterIsSimpleTypeConstraint={false} />
          </State>
          <State label="no search results">
            <DocumentListPaneContent {...BASE_PROPS} hasSearchQuery />
          </State>
          <State label="fetch error, retries exhausted">
            <DocumentListPaneContent
              {...BASE_PROPS}
              autoRetry={false}
              canRetry
              error={{message: 'Attribute or a string key expected: publishedAt'}}
              isRetrying={false}
              onRetry={noop}
              retryCount={3}
            />
          </State>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
