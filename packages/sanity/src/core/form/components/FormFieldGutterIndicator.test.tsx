import {type Path} from '@sanity/types'
import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {
  DocumentDivergencesContext,
  type DocumentDivergencesContextValue,
  VariantDiffContext,
  type VariantDiffContextValue,
} from 'sanity/_singletons'
import {describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {
  type DivergenceNavigator,
  type ReachableDivergence,
} from '../../divergence/divergenceNavigator'
import {type Divergence} from '../../divergence/readDocumentDivergences'
import {FormFieldGutterIndicator} from './FormFieldGutterIndicator'

const VARIANT_ICON = '[data-sanity-icon="rhombus-fill"]'
const DIVERGENCE_ICON = '[data-sanity-icon="edit"]'

const baseDivergence: Divergence = {
  path: 'title',
  effect: 'set',
  documentId: 'upstream-doc',
  documentType: 'article',
  subjectId: 'drafts.doc-1',
  sinceRevisionId: 'upstream-doc@rev-1',
  isAddressable: true,
  status: 'unresolved',
  snapshots: {
    subjectHead: undefined,
    upstreamHead: undefined,
    upstreamAtFork: undefined,
  },
}

const reachableDivergence: ReachableDivergence = {
  ...baseDivergence,
  isComposite: false,
  divergences: [['title', baseDivergence]],
  schemaType: {name: 'string', jsonType: 'string'},
}

const divergenceNavigator: DivergenceNavigator = {
  focusDivergence: vi.fn(),
  blurDivergence: vi.fn(),
  blurFocusedDivergence: vi.fn(),
  state: {
    focusedDivergence: undefined,
    previousDivergence: undefined,
    nextDivergence: undefined,
    state: 'ready',
    upstreamId: 'upstream-doc',
    allDivergences: [['title', baseDivergence]],
    divergences: [['title', reachableDivergence]],
    divergencesByNode: {title: 1},
  },
}

const DIVERGENCE_ABSENT: DocumentDivergencesContextValue = {enabled: false, sessionId: null}

const DIVERGENCE_ON_TITLE: DocumentDivergencesContextValue = {
  ...divergenceNavigator,
  enabled: true,
  sessionId: 'session-1',
}

function variantDiff(
  changedFields: string[],
  onReviewChanges?: () => void,
): VariantDiffContextValue {
  return {enabled: true, changedFields: new Set(changedFields), onReviewChanges}
}

async function renderGutter({
  path,
  divergences = DIVERGENCE_ABSENT,
  variant,
}: {
  path: Path
  divergences?: DocumentDivergencesContextValue
  variant: VariantDiffContextValue
}) {
  const TestProvider = await createTestProvider()

  const wrap = (children: ReactNode) => (
    <TestProvider>
      <DocumentDivergencesContext.Provider value={divergences}>
        <VariantDiffContext.Provider value={variant}>{children}</VariantDiffContext.Provider>
      </DocumentDivergencesContext.Provider>
    </TestProvider>
  )

  return render(wrap(<FormFieldGutterIndicator path={path} />))
}

describe('FormFieldGutterIndicator', () => {
  test('marks a top-level field that differs from the default', async () => {
    const {container} = await renderGutter({
      path: ['title'],
      variant: variantDiff(['title']),
    })

    expect(container.querySelector(VARIANT_ICON)).not.toBeNull()
  })

  test('does not mark a field that matches the default', async () => {
    const {container} = await renderGutter({
      path: ['title'],
      variant: variantDiff(['body']),
    })

    expect(container.querySelector(VARIANT_ICON)).toBeNull()
  })

  test('does not mark anything when no variant is selected', async () => {
    const {container} = await renderGutter({
      path: ['title'],
      variant: {enabled: false},
    })

    expect(container.querySelector(VARIANT_ICON)).toBeNull()
  })

  test('does not mark a nested path, even when its object field differs', async () => {
    // Granularity is top-level: customising one nested value marks the whole object field, not the
    // nested field itself.
    const {container} = await renderGutter({
      path: ['seo', 'title'],
      variant: variantDiff(['title', 'seo']),
    })

    expect(container.querySelector(VARIANT_ICON)).toBeNull()
  })

  test('does not mark an array item', async () => {
    const {container} = await renderGutter({
      path: ['body', {_key: 'abc123'}],
      variant: variantDiff(['body']),
    })

    expect(container.querySelector(VARIANT_ICON)).toBeNull()
  })

  test('gives an unresolved divergence the gutter, and shows only that mark', async () => {
    const {container} = await renderGutter({
      path: ['title'],
      divergences: DIVERGENCE_ON_TITLE,
      variant: variantDiff(['title']),
    })

    expect(container.querySelector(DIVERGENCE_ICON)).not.toBeNull()
    expect(container.querySelector(VARIANT_ICON)).toBeNull()
  })

  test('still marks a variant difference on a field with no divergence of its own', async () => {
    const {container} = await renderGutter({
      path: ['body'],
      divergences: DIVERGENCE_ON_TITLE,
      variant: variantDiff(['body']),
    })

    expect(container.querySelector(VARIANT_ICON)).not.toBeNull()
  })

  test('opens review changes when the mark is activated', async () => {
    const onReviewChanges = vi.fn()
    const {container} = await renderGutter({
      path: ['title'],
      variant: variantDiff(['title'], onReviewChanges),
    })

    const button = container.querySelector(VARIANT_ICON)?.closest('button')
    button?.click()

    expect(onReviewChanges).toHaveBeenCalledTimes(1)
  })

  test('renders the mark inert when review changes is unavailable', async () => {
    const {container} = await renderGutter({
      path: ['title'],
      variant: variantDiff(['title']),
    })

    expect(container.querySelector(VARIANT_ICON)?.closest('button')).toBeDisabled()
  })
})
