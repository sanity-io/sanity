import {type SanityDocument} from '@sanity/client'
import noop from 'lodash-es/noop.js'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {canvasUsEnglishLocaleBundle} from '../../../i18n'
import {LinkToCanvasDialog} from '../LinkToCanvasDialog'
import {type useLinkToCanvas} from '../useLinkToCanvas'

type LinkState = ReturnType<typeof useLinkToCanvas>

// The hook runs the studio-to-canvas preflight request and resolves the
// studio app id and organization, none of which the mock client serves. The
// dialog owns only the rendering of each resulting state, so that boundary is
// what the test controls.
const link = vi.hoisted(() => ({state: {status: 'validating'} as LinkState}))
vi.mock('../useLinkToCanvas', () => ({useLinkToCanvas: () => link.state}))

const DRAFT: SanityDocument = {
  _id: 'drafts.canvas-dialog-doc',
  _type: 'author',
  _rev: 'rev1',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  name: 'Ada Lovelace',
}

function LinkToCanvasDialogHarness() {
  return (
    <TestWrapper schemaTypes={[]} i18nBundles={[canvasUsEnglishLocaleBundle]}>
      <LinkToCanvasDialog document={DRAFT} onClose={noop} />
    </TestWrapper>
  )
}

describe('LinkToCanvasDialog', () => {
  test('shows the preflight error in a critical card', async () => {
    const {settleChromaticEndState} = testHelpers()
    link.state = {
      status: 'error',
      error: 'Studio app not found, try deploying it or set the fallbackStudioOrigin',
    }
    void render(<LinkToCanvasDialogHarness />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByText('Link to Canvas')).toBeVisible()
    await expect
      .element(
        dialog.getByText('Studio app not found, try deploying it or set the fallbackStudioOrigin'),
      )
      .toBeVisible()
    expect(dialog.getByRole('button', {name: 'Accept and continue'}).elements()).toHaveLength(0)

    await settleChromaticEndState()
  })

  test('asks to confirm the document changes before linking', async () => {
    const {settleChromaticEndState} = testHelpers()
    // No mapped document: `DocumentDiff` needs the document store and active
    // workspace, which the mock studio does not provide (the LinkToCanvasDiff
    // story makes the same cut). The warning card, version chips and confirm
    // footer are the dialog's own state.
    link.state = {
      status: 'diff',
      error: null,
      navigateToCanvas: noop,
      response: {
        originalDocument: DRAFT,
        mappedDocument: undefined,
        diff: [{type: 'removed', indexedPath: ['bio'], prevValue: 'Mathematician', value: null}],
      },
    }
    void render(<LinkToCanvasDialogHarness />)

    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByText('Confirm document changes')).toBeVisible()
    await expect.element(dialog.getByText('You can unlink from Canvas at any time')).toBeVisible()
    await expect.element(dialog.getByRole('button', {name: 'Accept and continue'})).toBeEnabled()
    await expect.element(dialog.getByRole('button', {name: 'Cancel'})).toBeEnabled()

    await settleChromaticEndState()
  })
})
