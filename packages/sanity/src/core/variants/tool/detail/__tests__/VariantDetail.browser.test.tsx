import {type SanityDocument} from '@sanity/client'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useClient} from '../../../../hooks/useClient'
import {LocaleProvider} from '../../../../i18n/components/LocaleProvider'
import {type DocumentPreviewStore} from '../../../../preview/documentPreviewStore'
import {ResourceCacheProvider, useResourceCache} from '../../../../store/ResourceCacheProvider'
import {useWorkspace} from '../../../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type VariantStore} from '../../../store/createVariantsStore'
import {type VariantStoreState} from '../../../store/reducer'
import {getVariantId} from '../../util'
import {VariantDetail} from '../VariantDetail'

const ARTICLE_TYPE = {
  name: 'article',
  type: 'document',
  fields: [
    {name: 'title', type: 'string'},
    // Required so a document without a summary fails validation and the table shows its
    // critical glyph next to the muted checks of the valid rows.
    {
      name: 'summary',
      type: 'string',
      validation: (rule: {required: () => unknown}) => rule.required(),
    },
  ],
  preview: {select: {title: 'title', subtitle: 'summary'}},
}

// Fixed, months-old timestamps: `RelativeTime` renders an absolute date once more than a month
// has passed, so the "Created" and "Last edited" cells read the same in every run.
const CREATED_AT = '2025-01-03T00:00:00Z'
const UPDATED_AT = '2025-06-01T08:00:00Z'

const VARIANT_REF = {_ref: variantAlphaAudience._id, _key: 'variant'}

function variantDocument(
  groupId: string,
  bundleId: 'published' | 'drafts',
  fields: Record<string, unknown>,
): SanityDocument {
  const scopeId = bundleId === 'published' ? 'scope-pub' : 'scope-draft'
  return {
    _id: `versions.${scopeId}.${groupId}`,
    _type: 'article',
    _rev: `rev-${groupId}-${bundleId}`,
    _createdAt: CREATED_AT,
    _updatedAt: UPDATED_AT,
    _system: {
      group: {_ref: groupId, _weak: true},
      scopeId,
      variants: [VARIANT_REF],
      ...(bundleId === 'drafts' ? {bundleId} : {}),
    },
    ...fields,
  }
}

// Three document groups: one published with a draft on top, one published only, one draft only
// (and invalid), so the table exercises the bundle chips, the unpublished-changes count and every
// validation state.
const DOCUMENTS: SanityDocument[] = [
  variantDocument('summer-campaign', 'published', {
    title: 'Summer campaign',
    summary: 'Live on the site',
  }),
  variantDocument('summer-campaign', 'drafts', {
    title: 'Summer campaign',
    summary: 'Live on the site, with pending copy edits',
  }),
  variantDocument('winter-campaign', 'published', {
    title: 'Winter campaign',
    summary: 'Live on the site',
  }),
  variantDocument('autumn-campaign', 'drafts', {title: 'Autumn campaign'}),
]

const DOCUMENTS_BY_ID = new Map(DOCUMENTS.map((document) => [document._id, document]))

const PREVIEWS: Record<string, {title: string; subtitle?: string}> = {
  'summer-campaign': {title: 'Summer campaign', subtitle: 'Live on the site'},
  'winter-campaign': {title: 'Winter campaign', subtitle: 'Live on the site'},
  'autumn-campaign': {title: 'Autumn campaign'},
}

/**
 * The mock studio's client answers every query with `null`, which the real preview store cannot
 * turn into documents, so the document set, the documents and their previews are served from the
 * fixtures above instead. Only the methods `useBundleDocuments` and the preview column call.
 */
const STUB_PREVIEW_STORE: Pick<
  DocumentPreviewStore,
  | 'observeForPreview'
  | 'unstable_observeDocument'
  | 'unstable_observeDocumentIdSet'
  | 'unstable_observeDocumentPairAvailability'
> = {
  observeForPreview: (value, type) =>
    of({type, snapshot: ('_id' in value && PREVIEWS[value._id]) || null}),
  unstable_observeDocument: (id) => of(DOCUMENTS_BY_ID.get(id)),
  unstable_observeDocumentIdSet: () =>
    of({status: 'connected' as const, documentIds: DOCUMENTS.map((document) => document._id)}),
  unstable_observeDocumentPairAvailability: (id) => {
    const document = DOCUMENTS_BY_ID.get(id)
    const published = document?._system?.bundleId !== 'drafts'
    return of({
      published: published
        ? {available: true as const, reason: 'READABLE' as const}
        : {available: false as const, reason: 'NOT_FOUND' as const},
      draft: {available: false as const, reason: 'NOT_FOUND' as const},
    })
  },
}

const LOADED_STATE: VariantStoreState = {
  variants: new Map([
    [variantAlphaAudience._id, variantAlphaAudience],
    [variantNorwegianMarket._id, variantNorwegianMarket],
  ]),
  state: 'loaded',
}

const VARIANTS_STORE: VariantStore = {
  state$: of(LOADED_STATE),
  initialState: LOADED_STATE,
  dispatch: noop,
}

function SeededStores(props: {children: ReactNode}) {
  const {children} = props
  const workspace = useWorkspace()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const resourceCache = useResourceCache()
  // Seeded during the first render so `useVariantsStore` and `useDocumentPreviewStore` in the
  // children find the stubs instead of creating the real stores.
  useState(() => {
    resourceCache.set({
      namespace: 'VariantsStore',
      dependencies: [workspace],
      value: VARIANTS_STORE,
    })
    resourceCache.set({
      namespace: 'documentPreviewStore',
      dependencies: [client],
      value: STUB_PREVIEW_STORE,
    })
    return null
  })
  return children
}

// The detail page reads the variant from the route, so the harness mounts its own router with
// the tool's `:variantId` segment (and the intent routes the preview column's edit links need).
// The locale provider is needed by the relative "Created" / "Last edited" timestamps.
const router = route.create('/', [route.intents('/intent'), route.create('/:variantId')])

function VariantDetailHarness(props: {variantId: string}) {
  const {variantId} = props
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[ARTICLE_TYPE]}>
      <LocaleProvider>
        <ResourceCacheProvider>
          <SeededStores>
            <RouterProvider router={router} state={{variantId}} onNavigate={noop}>
              <VariantDetail />
            </RouterProvider>
          </SeededStores>
        </ResourceCacheProvider>
      </LocaleProvider>
    </TestWrapper>
  )
}

const {settleChromaticEndState} = testHelpers()

describe('VariantDetail', () => {
  it('shows the definition, its details and the documents it holds', async () => {
    void render(<VariantDetailHarness variantId={getVariantId(variantAlphaAudience._id)} />)

    await expect
      .element(page.getByTestId('variant-title-display'))
      .toHaveTextContent('Alpha audience')
    const definition = page.getByTestId('variant-detail-definition')
    await expect.element(definition.getByText('alpha')).toBeVisible()
    await expect.element(definition.getByText('en-US')).toBeVisible()

    const table = page.getByTestId('variant-documents-table')
    await expect.poll(() => table.getByTestId('table-row').elements().length).toBe(3)
    await expect.element(table.getByText('Summer campaign')).toBeVisible()
    await expect.element(table.getByText('Winter campaign')).toBeVisible()
    await expect.element(table.getByText('Autumn campaign')).toBeVisible()

    // Validation and the edited-by lookups settle after the rows render: every row must have
    // left its validating / skeleton state before the end state is archived.
    await expect
      .poll(() => table.getByTestId('variant-document-validation-valid').elements().length)
      .toBe(2)
    await expect
      .poll(() => table.getByTestId('variant-document-validation-error').elements().length)
      .toBe(1)
    await expect.poll(() => document.body.querySelectorAll('[data-ui="Skeleton"]').length).toBe(0)

    const details = page.getByTestId('variant-detail-documents')
    await expect.element(details.getByText('Total documents')).toBeVisible()
    await expect.element(details.getByText('Unpublished changes')).toBeVisible()

    await settleChromaticEndState()
    expect(details.element().textContent).toContain('3')
    expect(details.element().textContent).toContain('2')
  })

  it('renders the not-found state for a variant id the store does not hold', async () => {
    void render(<VariantDetailHarness variantId="retired-variant" />)

    await expect.element(page.getByText('Variant definition not found')).toBeVisible()
    await expect
      .element(page.getByText('The requested variant definition could not be found.'))
      .toBeVisible()

    await settleChromaticEndState()
    expect(page.getByTestId('variant-title-display').elements()).toHaveLength(0)
  })
})
