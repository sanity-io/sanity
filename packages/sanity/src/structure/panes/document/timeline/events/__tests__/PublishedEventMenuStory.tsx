import {Card} from '@sanity/ui'
import {type PublishDocumentVersionEvent} from 'sanity'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type PaneRouterContextValue} from '../../../../../components/paneRouter/types'
import {PaneRouterContext} from '../../../../../components/paneRouter/usePaneRouter'
import {PublishedEventMenu} from '../PublishedEventMenu'

const NOOP = () => undefined

const paneRouterContextValue: PaneRouterContextValue = {
  index: 0,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [],
  ChildLink: ({children}) => <>{children}</>,
  ReferenceChildLink: ({children}) => <>{children}</>,
  handleEditReference: NOOP,
  ParameterizedLink: () => null,
  replaceCurrent: NOOP,
  closeCurrent: NOOP,
  closeCurrentAndAfter: NOOP,
  duplicateCurrent: NOOP,
  setView: NOOP,
  setParams: NOOP,
  setPayload: NOOP,
  createPathWithParams: () => '',
  navigateIntent: NOOP,
}

const DRAFT_PUBLISH: PublishDocumentVersionEvent = {
  type: 'publishDocumentVersion',
  id: 'publish-draft',
  timestamp: '2020-06-16T12:00:00.000Z',
  author: 'doug',
  documentVariantType: 'published',
  documentId: 'article-1',
  revisionId: 'rev-3',
  versionId: 'drafts.article-1',
  versionRevisionId: 'rev-2',
  publishCause: 'document.publish',
}

/**
 * Chromatic sentinel for the published-event action menu on a draft publish:
 * the open MenuItem whose ui5 Text follows `--card-fg-color` around the
 * caution VersionBadge, so a Sanity UI theme swap cannot wash the label out
 * on the selected tone. No live timeline; pane router is a fixture. Shared
 * with Storybook via a thin CSF wrapper that clicks the trigger.
 */
export function PublishedEventMenuStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <PaneRouterContext.Provider value={paneRouterContextValue}>
        <Flex alignItems="flex-start" style={{minHeight: 240}}>
          <Card padding={2} radius={2} shadow={1}>
            <PublishedEventMenu event={DRAFT_PUBLISH} />
          </Card>
        </Flex>
      </PaneRouterContext.Provider>
    </TestWrapper>
  )
}
