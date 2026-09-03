import {defineField, defineType, type SanityDocument} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {LocaleProvider} from 'sanity'
import {route, RouterProvider, type RouterState} from 'sanity/router'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {FixturePreviewStoreProvider} from '../../../../components/__tests__/FixturePreviewStoreProvider'
import {
  DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_SEARCH_PARAMETER,
} from '../../../constants'
import {DocumentGroupPickerMenu} from '../DocumentGroupPickerMenu'
import {VersionModeHeader} from '../VersionModeHeader'

const SCHEMA_TYPES = [
  defineType({
    name: 'author',
    type: 'document',
    title: 'Author',
    fields: [defineField({name: 'name', type: 'string'})],
    preview: {select: {title: 'name'}},
  }),
]

const DOCUMENT_ID = 'author-1'
const PREVIOUS_ID = DOCUMENT_ID
const NEXT_ID = `versions.rSummerSale.${DOCUMENT_ID}`
const TIMESTAMPS = {
  _rev: 'rev1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
}

const DOCUMENTS: SanityDocument[] = [
  {_id: DOCUMENT_ID, _type: 'author', name: 'Jane Doe', ...TIMESTAMPS},
  {_id: `drafts.${DOCUMENT_ID}`, _type: 'author', name: 'Jane Doe (draft)', ...TIMESTAMPS},
  {
    _id: NEXT_ID,
    _type: 'author',
    name: 'Jane Doe (summer sale)',
    _system: {
      bundleId: 'rSummerSale',
      release: {_ref: '_.releases.rSummerSale', _weak: true},
      group: {_ref: DOCUMENT_ID, _weak: true},
      scopeId: 'rSummerSale',
    },
    ...TIMESTAMPS,
  },
]

const router = route.create('/', [route.intents('/intent')])

// The header reads which two documents are being compared from the router's
// search params, so the harness nests a router carrying a ready diff state.
const DIFF_VIEW_ROUTER_STATE: RouterState = {
  _searchParams: [
    [DIFF_VIEW_SEARCH_PARAMETER, 'version'],
    [DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER, `author,${PREVIOUS_ID}`],
    [DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER, `author,${NEXT_ID}`],
  ],
}

export type VersionModeHeaderStoryMode = 'version-menu' | 'group-picker'

function DiffViewRouter({children}: {children: ReactNode}) {
  return (
    <RouterProvider router={router} state={DIFF_VIEW_ROUTER_STATE} onNavigate={noop}>
      {children}
    </RouterProvider>
  )
}

/**
 * Chromatic sentinel for the diff view's version-mode header ahead of the
 * ui5 Flex migration: the three-column header grid with the title, the two
 * version pickers, the transfer icon and the close button. `version-menu`
 * renders the default release menu buttons (published on the left, a release
 * version on the right); `group-picker` enables the document group inventory
 * beta so the header renders `DocumentGroupPickerMenu` buttons instead. The
 * pickers stay closed. Versions come from the fixture preview store; no
 * network.
 */
export function VersionModeHeaderStory(props: {mode: VersionModeHeaderStoryMode}) {
  const groupPicker = props.mode === 'group-picker'
  return (
    <TestWrapper
      betaFeatures={groupPicker ? {documentGroupInventory: {enabled: true}} : undefined}
      schemaTypes={SCHEMA_TYPES}
    >
      <FixturePreviewStoreProvider documents={DOCUMENTS}>
        <LocaleProvider>
          <DiffViewRouter>
            <VersionModeHeader documentId={DOCUMENT_ID} state="ready" />
            {groupPicker && (
              <div style={{padding: 16}}>
                <DocumentGroupPickerMenu
                  document={{id: `drafts.${DOCUMENT_ID}`, type: 'author'}}
                  onSelectDocument={noop}
                  role="previous"
                />
              </div>
            )}
          </DiffViewRouter>
        </LocaleProvider>
      </FixturePreviewStoreProvider>
    </TestWrapper>
  )
}
