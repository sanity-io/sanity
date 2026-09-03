import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {PublishIcon} from '@sanity/icons/Publish'
import {SortIcon} from '@sanity/icons/Sort'
import {TrashIcon} from '@sanity/icons/Trash'
import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {Badge, Card, Stack, TabList, Text, TextInput} from '@sanity/ui'
import {
  type DocumentPresence,
  LocaleProvider,
  PreviewCard,
  useDocumentPreviewStore,
  useSchema,
} from 'sanity'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {Tab} from '../../../../ui-components/tab/Tab'
import {type PaneMenuItem, type PaneMenuItemGroup} from '../../../types'
import {FixturePreviewStoreProvider} from '../../__tests__/FixturePreviewStoreProvider'
import {PaneHeaderActions} from '../../paneHeaderActions/PaneHeaderActions'
import {PaneItemPreview} from '../../paneItem/PaneItemPreview'
import {Pane} from '../Pane'
import {PaneContent} from '../PaneContent'
import {PaneHeader} from '../PaneHeader'
import {PaneLayout} from '../PaneLayout'

const SCHEMA_TYPES = [
  defineType({
    name: 'author',
    type: 'document',
    title: 'Author',
    fields: [
      defineField({name: 'name', type: 'string'}),
      defineField({name: 'role', type: 'string'}),
    ],
    preview: {select: {title: 'name', subtitle: 'role'}},
  }),
]

const TIMESTAMPS = {
  _rev: 'rev1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
}

const DOCUMENTS: SanityDocument[] = [
  {_id: 'author-1', _type: 'author', name: 'Jane Doe', role: 'Editor in chief', ...TIMESTAMPS},
  {
    _id: 'drafts.author-1',
    _type: 'author',
    name: 'Jane Doe',
    role: 'Editor in chief',
    ...TIMESTAMPS,
  },
  {
    _id: 'drafts.author-2',
    _type: 'author',
    name: 'An author with a name long enough to truncate inside the pane item preview row',
    role: 'Contributor',
    ...TIMESTAMPS,
  },
  {_id: 'author-3', _type: 'author', name: 'Sam Smith', ...TIMESTAMPS},
  {
    _id: 'versions.rSummerSale.author-3',
    _type: 'author',
    name: 'Sam Smith',
    _system: {
      bundleId: 'rSummerSale',
      release: {_ref: '_.releases.rSummerSale', _weak: true},
      group: {_ref: 'author-3', _weak: true},
      scopeId: 'rSummerSale',
    },
    ...TIMESTAMPS,
  },
]

const PRESENCE: DocumentPresence[] = [
  {
    user: {id: 'user-a', displayName: 'Ada Lovelace'},
    path: ['name'],
    sessionId: 'session-a',
    lastActiveAt: '2024-01-02T00:00:00Z',
    documentId: 'drafts.author-1',
  },
  {
    user: {id: 'user-b', displayName: 'Grace Hopper'},
    path: ['role'],
    sessionId: 'session-b',
    lastActiveAt: '2024-01-02T00:00:00Z',
    documentId: 'drafts.author-1',
  },
]

const MENU_ITEMS: PaneMenuItem[] = [
  {title: 'Publish', icon: PublishIcon, action: 'publish', showAsAction: true},
  {title: 'Preview', icon: EyeOpenIcon, action: 'preview', showAsAction: true, selected: true},
  {title: 'Sort by title', icon: SortIcon, action: 'setSortOrder', group: 'sorting'},
  {title: 'Sort by last edited', icon: SortIcon, action: 'setSortOrder', group: 'sorting'},
  {title: 'Delete', icon: TrashIcon, action: 'delete', tone: 'critical'},
]

const MENU_ITEM_GROUPS: PaneMenuItemGroup[] = [{id: 'sorting', title: 'Sort'}]

// Published with presence, published plus a release version, draft only.
const LIST_ITEMS = [
  {_id: 'author-1', _type: 'author'},
  {_id: 'author-3', _type: 'author'},
  {_id: 'drafts.author-2', _type: 'author'},
]

const LONG_TITLE =
  'Authors, contributors and editors: a pane title long enough to truncate before the actions'

function AuthorList() {
  const schema = useSchema()
  const documentPreviewStore = useDocumentPreviewStore()
  const schemaType = schema.get('author')
  if (!schemaType) return null

  return (
    <Stack gap={1} padding={2}>
      {LIST_ITEMS.map((value, index) => (
        <PreviewCard key={value._id} __unstable_focusRing as="a" href="#" radius={2}>
          <PaneItemPreview
            documentPreviewStore={documentPreviewStore}
            icon={false}
            layout="default"
            presence={index === 0 ? PRESENCE : undefined}
            schemaType={schemaType}
            value={value}
          />
        </PreviewCard>
      ))}
    </Stack>
  )
}

/**
 * Chromatic sentinel for structure pane chrome ahead of the ui5 Flex
 * migration. Two panes in a `PaneLayout`: a list pane whose header has a back
 * button, a truncating title, header actions (two action buttons and the
 * critical context menu), tabs plus a sub-action, over document rows with
 * presence avatars and version status; and a document pane whose header has an
 * appended badge and a `contentAfter` slot. The CSF file adds a collapsed
 * variant by clicking the first pane's title. Previews come from the fixture
 * preview store; no network. No create button: its template permissions go
 * through the grants store, which the mock client cannot serve.
 */
export function PaneChromeStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <FixturePreviewStoreProvider documents={DOCUMENTS}>
        <LocaleProvider>
          <div style={{height: 520}}>
            <PaneLayout height="fill" minWidth={512}>
              <Pane id="authors" minWidth={320}>
                <PaneHeader
                  actions={
                    <PaneHeaderActions menuItemGroups={MENU_ITEM_GROUPS} menuItems={MENU_ITEMS} />
                  }
                  backButton={
                    <Button
                      as="a"
                      href="#"
                      icon={ArrowLeftIcon}
                      mode="bleed"
                      tooltipProps={{content: 'Back'}}
                    />
                  }
                  border
                  subActions={<Button icon={SortIcon} mode="bleed" text="Sort" />}
                  tabs={
                    <TabList gap={1}>
                      <Tab aria-controls="all" id="all-tab" label="All" selected />
                      <Tab aria-controls="recent" id="recent-tab" label="Recently edited" />
                    </TabList>
                  }
                  title={LONG_TITLE}
                />
                <PaneContent overflow="auto">
                  <AuthorList />
                </PaneContent>
              </Pane>
              <Pane id="document" flex={2}>
                <PaneHeader
                  appendTitle={<Badge fontSize={0}>Draft</Badge>}
                  contentAfter={
                    <Card borderTop padding={2}>
                      <TextInput fontSize={1} placeholder="Search in document" readOnly />
                    </Card>
                  }
                  title="Jane Doe"
                />
                <PaneContent overflow="auto">
                  <Card padding={4}>
                    <Text muted size={1}>
                      Document content
                    </Text>
                  </Card>
                </PaneContent>
              </Pane>
            </PaneLayout>
          </div>
        </LocaleProvider>
      </FixturePreviewStoreProvider>
    </TestWrapper>
  )
}
