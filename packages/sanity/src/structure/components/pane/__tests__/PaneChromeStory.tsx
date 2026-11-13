import {DocumentsIcon} from '@sanity/icons/Documents'
import {UsersIcon} from '@sanity/icons/Users'
import {Card, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {LocaleProvider} from 'sanity'
import {Box, Flex, Text as Text5, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ErrorPane} from '../../../panes/error/ErrorPane'
import {ListPaneContent} from '../../../panes/list/ListPaneContent'
import {LoadingPane} from '../../../panes/loading/LoadingPane'
import {UnknownPane} from '../../../panes/unknown/UnknownPaneType'
import {HELP_URL, SerializeError} from '../../../structureBuilder/SerializeError'
import {PaneResolutionError} from '../../../structureResolvers/PaneResolutionError'
import {type PaneListItem, type PaneListItemDivider} from '../../../types'
import {type PaneRouterContextValue} from '../../paneRouter/types'
import {PaneRouterContext} from '../../paneRouter/usePaneRouter'
import {NoDocumentTypesScreen} from '../../structureTool/NoDocumentTypesScreen'
import {StructureError} from '../../structureTool/StructureError'
import {Pane} from '../Pane'
import {PaneContent} from '../PaneContent'
import {Root as PaneContentRoot} from '../PaneContent.styles'
import {PaneDivider} from '../PaneDivider'
import {PaneFooter} from '../PaneFooter'
import {Root as PaneFooterRoot, RootCard as PaneFooterRootCard} from '../PaneFooter.styles'
import {PaneHeader} from '../PaneHeader'
import {
  Layout as PaneHeaderLayout,
  Root as PaneHeaderRoot,
  TitleCard,
  TitleText,
  TitleTextSkeleton,
} from '../PaneHeader.styles'
import {PaneLayout} from '../PaneLayout'
import {Root as PaneLayoutRoot} from '../PaneLayout.styles'

const SERIALIZE_ERROR = new SerializeError(
  '`title` is required for list items',
  ['root', 'content', 'authors'],
  'authors',
  'listItem',
).withHelpUrl(HELP_URL.TITLE_REQUIRED)

const RESOLUTION_ERROR = new PaneResolutionError({
  message: 'Could not resolve the structure for `content;authors`',
  cause: SERIALIZE_ERROR,
})

const UNKNOWN_PANE = {type: 'customPane', id: 'unknown-fixture'}

const LIST_ITEMS: (PaneListItem | PaneListItemDivider)[] = [
  {type: 'listItem', id: 'authors', title: 'Authors', icon: UsersIcon},
  {type: 'listItem', id: 'posts', title: 'Posts', icon: DocumentsIcon},
  {type: 'divider', title: 'Settings'},
  {type: 'listItem', id: 'siteSettings', title: 'Site settings'},
]

const noop = () => undefined

const PANE_ROUTER: PaneRouterContextValue = {
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
  handleEditReference: noop,
  ParameterizedLink: () => null,
  replaceCurrent: noop,
  closeCurrent: noop,
  closeCurrentAndAfter: noop,
  duplicateCurrent: noop,
  setView: noop,
  setParams: noop,
  setPayload: noop,
  createPathWithParams: () => '',
  navigateIntent: noop,
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

/**
 * Harness for the structure tool's pane chrome: a nested `PaneLayout` with
 * the built-in loading, error and unknown-type panes (which exercises the
 * dividers between panes), the styled primitives behind `PaneHeader`,
 * `PaneContent`, `PaneFooter` and `PaneLayout`, the "no document types"
 * screen and the structure resolution error screen. The resolution error is
 * a fixture `PaneResolutionError` whose `SerializeError` cause carries a
 * structure path and a help id, so the path breadcrumb, the stack-less
 * message and the docs link all render.
 */
export function PaneChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <VStack gap={6}>
          <Section title="loading, error and unknown panes">
            <Card border style={{height: 320}}>
              <PaneLayout height="fill">
                <LoadingPane paneKey="loading" message="Resolving authors…" />
                <ErrorPane paneKey="error" title="Could not load">
                  <Text size={1}>The document list failed to load.</Text>
                </ErrorPane>
                <UnknownPane isSelected paneKey="unknown" pane={UNKNOWN_PANE} />
              </PaneLayout>
            </Card>
          </Section>

          <Section title="list pane content and divider">
            <Card border style={{height: 280}}>
              <PaneLayout height="fill">
                <PaneRouterContext.Provider value={PANE_ROUTER}>
                  <Pane id="list">
                    <PaneHeader title="Content" border />
                    <ListPaneContent
                      childItemId="authors"
                      isActive
                      items={LIST_ITEMS}
                      showIcons
                      title="Content"
                    />
                  </Pane>
                </PaneRouterContext.Provider>
                <PaneDivider element={null} />
                <Pane id="list-collapsed">
                  <PaneContent>
                    <Box padding={4}>
                      <Text size={1} muted>
                        Resizable divider to the left, fixed divider to the right
                      </Text>
                    </Box>
                  </PaneContent>
                </Pane>
                <PaneDivider disabled element={null} />
              </PaneLayout>
            </Card>
          </Section>

          <Section title="pane with header, content and footer">
            <Card border style={{height: 240}}>
              <PaneLayout height="fill">
                <Pane id="composed">
                  <PaneHeader title="Authors" border />
                  <PaneContent overflow="auto">
                    <Box padding={4}>
                      <Text size={1}>Pane content</Text>
                    </Box>
                  </PaneContent>
                  <PaneFooter padding={3}>
                    <Text size={1} muted>
                      Pane footer
                    </Text>
                  </PaneFooter>
                </Pane>
              </PaneLayout>
            </Card>
          </Section>

          <Section title="pane header primitives">
            <PaneHeaderRoot $border>
              <PaneHeaderLayout alignItems="center" padding={2}>
                <TitleCard flex={1} padding={2}>
                  <TitleText size={1} weight="medium" textOverflow="ellipsis">
                    Title text
                  </TitleText>
                </TitleCard>
              </PaneHeaderLayout>
            </PaneHeaderRoot>
            <PaneHeaderRoot>
              <PaneHeaderLayout alignItems="center" padding={2}>
                <TitleCard flex={1} padding={2}>
                  <TitleTextSkeleton animated={false} size={1} />
                </TitleCard>
              </PaneHeaderLayout>
            </PaneHeaderRoot>
          </Section>

          <Section title="pane layout, content and footer primitives">
            <PaneLayoutRoot border data-mounted="" style={{height: 120}}>
              <PaneContentRoot flex={1} padding={3}>
                <Text size={1}>Content root</Text>
              </PaneContentRoot>
            </PaneLayoutRoot>
            <PaneFooterRoot>
              <PaneFooterRootCard borderTop padding={3}>
                <Text size={1} muted>
                  Footer root card
                </Text>
              </PaneFooterRootCard>
            </PaneFooterRoot>
          </Section>

          <Section title="no document types">
            <Card border style={{height: 240}}>
              <NoDocumentTypesScreen />
            </Card>
          </Section>

          <Section title="structure error">
            <Flex style={{height: 420}}>
              <StructureError error={RESOLUTION_ERROR} onReload={noop} />
            </Flex>
          </Section>
        </VStack>
      </LocaleProvider>
    </TestWrapper>
  )
}
