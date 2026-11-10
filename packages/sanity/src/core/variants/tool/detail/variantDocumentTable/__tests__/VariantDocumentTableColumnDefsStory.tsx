import {Card} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {useClient} from '../../../../../hooks/useClient'
import {LocaleProvider} from '../../../../../i18n/components/LocaleProvider'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {type DocumentPreviewStore} from '../../../../../preview/documentPreviewStore'
import {activeASAPRelease} from '../../../../../releases/__fixtures__/release.fixture'
import {TableProvider} from '../../../../../releases/tool/components/Table/TableProvider'
import {type InjectedTableProps} from '../../../../../releases/tool/components/Table/types'
import {ResourceCacheProvider, useResourceCache} from '../../../../../store/ResourceCacheProvider'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {variantsLocaleNamespace, variantsUsEnglishLocaleBundle} from '../../../../i18n'
import {type DocumentInVariantGroup, type VariantDocumentVersion} from '../../types'
import {getVariantDocumentTableColumnDefs} from '../VariantDocumentTableColumnDefs'

const ARTICLE_TYPE = {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {name: 'title', type: 'string'},
    {name: 'summary', type: 'string'},
  ],
  preview: {select: {title: 'title', subtitle: 'summary'}},
}

// Fixed, months-old timestamps: `RelativeTime` renders an absolute date once more than a month
// has passed, so the "Last edited" cell reads the same in every run.
const UPDATED_AT = '2025-06-01T08:00:00Z'

const PREVIEWS: Record<string, {title: string; subtitle?: string}> = {
  'summer-campaign': {title: 'Summer campaign', subtitle: 'Live on the site'},
  'winter-campaign': {title: 'Winter campaign', subtitle: 'Being checked'},
  'autumn-campaign': {title: 'Autumn campaign'},
}

// The preview column resolves its title through the document preview store; the mock studio's
// client would answer `null`, so the store is replaced by one that serves the fixtures above.
const STUB_PREVIEW_STORE: Pick<DocumentPreviewStore, 'observeForPreview'> = {
  observeForPreview: (value, type) =>
    of({type, snapshot: ('_id' in value && PREVIEWS[value._id]) || null}),
}

function SeededPreviewStore(props: {children: ReactNode}) {
  const {children} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const resourceCache = useResourceCache()
  // Seeded during the first render so `useDocumentPreviewStore` in the cells finds the stub
  // instead of creating the real store.
  useState(() => {
    resourceCache.set({
      namespace: 'documentPreviewStore',
      dependencies: [client],
      value: STUB_PREVIEW_STORE,
    })
    return null
  })
  return children
}

function version(
  documentId: string,
  bundleId: VariantDocumentVersion['bundleId'],
  releaseRef: string | null = null,
): VariantDocumentVersion {
  return {documentId, bundleId, releaseRef, updatedAt: UPDATED_AT}
}

function row(
  groupId: string,
  options: {
    versions: VariantDocumentVersion[]
    validation: DocumentInVariantGroup['validation']
    publishedDocumentExists: boolean
  },
): DocumentInVariantGroup {
  const {versions, validation, publishedDocumentExists} = options
  const [primary] = versions
  return {
    memoKey: `${groupId}-${primary.bundleId ?? 'published'}`,
    groupId,
    rowKey: groupId,
    document: {
      _id: primary.documentId,
      _type: 'article',
      _rev: `rev-${groupId}`,
      _createdAt: '2025-01-03T00:00:00Z',
      _updatedAt: UPDATED_AT,
      publishedDocumentExists,
    },
    validation,
    version: primary,
    versions,
  }
}

const VALID: DocumentInVariantGroup['validation'] = {
  hasError: false,
  isValidating: false,
  validation: [],
}

const VALIDATING: DocumentInVariantGroup['validation'] = {
  hasError: false,
  isValidating: true,
  validation: [],
}

const INVALID: DocumentInVariantGroup['validation'] = {
  hasError: true,
  isValidating: false,
  validation: [
    {level: 'error', message: 'Required', path: ['summary']},
    {level: 'error', message: 'Required', path: ['title']},
  ],
}

// One row per validation state, each with a different bundle mix so the "Appears in" chips and the
// preview's leading bundle badge render their published / drafts / release variants too.
const ROWS: DocumentInVariantGroup[] = [
  row('summer-campaign', {
    versions: [
      version('versions.scope-pub.summer-campaign', undefined),
      version('versions.scope-draft.summer-campaign', 'drafts'),
    ],
    validation: VALID,
    publishedDocumentExists: true,
  }),
  row('winter-campaign', {
    versions: [
      version(
        'versions.scope-release.winter-campaign',
        activeASAPRelease.name,
        activeASAPRelease._id,
      ),
    ],
    validation: VALIDATING,
    publishedDocumentExists: false,
  }),
  row('autumn-campaign', {
    versions: [version('versions.scope-draft.autumn-campaign', 'drafts')],
    validation: INVALID,
    publishedDocumentExists: false,
  }),
]

const RELEASES_BY_ID = new Map([[activeASAPRelease._id, activeASAPRelease]])

const CELL_PROPS: InjectedTableProps = {id: 'cell', style: {}}

function ColumnDefsTable() {
  const {t} = useTranslation(variantsLocaleNamespace)
  const columns = getVariantDocumentTableColumnDefs(t, 'alpha-audience', RELEASES_BY_ID).filter(
    (column) => !column.hidden,
  )

  return (
    <Card border radius={2} style={{width: 920}}>
      <Flex>
        {columns.map((column) => (
          <Flex key={String(column.id)} style={{width: column.width ?? undefined, ...column.style}}>
            {column.header({
              header: {id: column.id, sorting: column.sorting},
              headerProps: {id: `header-${String(column.id)}`, style: {}},
            })}
          </Flex>
        ))}
      </Flex>
      {ROWS.map((datum) => (
        <Flex key={datum.groupId} style={{borderTop: '1px solid var(--card-border-color)'}}>
          {columns.map((column) => (
            <Flex
              key={String(column.id)}
              style={{width: column.width ?? undefined, ...column.style}}
            >
              {column.cell({datum, cellProps: CELL_PROPS, sorting: false})}
            </Flex>
          ))}
        </Flex>
      ))}
    </Card>
  )
}

/**
 * Chromatic sentinel for the variant document table columns: header labels, the bundle chips,
 * type, document preview with its bundle badge, last edited, edited by, and every validation
 * glyph (valid / validating / error). Shared with Storybook via a thin CSF wrapper.
 */
export function VariantDocumentTableColumnDefsStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[ARTICLE_TYPE]}>
      <LocaleProvider>
        <ResourceCacheProvider>
          <SeededPreviewStore>
            <TableProvider defaultSort={{column: 'search', direction: 'asc'}}>
              <ColumnDefsTable />
            </TableProvider>
          </SeededPreviewStore>
        </ResourceCacheProvider>
      </LocaleProvider>
    </TestWrapper>
  )
}
