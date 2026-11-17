import {describe, expect, it} from 'vitest'

import {type PaintedElementKind} from '../../../instrumentation/types'
import {isMiscreditedDocumentOpen} from '../softNav'

describe('isMiscreditedDocumentOpen', () => {
  const documentOpen = (
    softLcpMs: number | null,
    lcpElement: string | null,
    lcpElementKind: PaintedElementKind | null,
  ) => ({
    label: 'document-open',
    softLcpMs,
    lcpElement,
    lcpElementKind,
    softFcpMs: 100,
    softInpMs: 96,
    softClsScore: 0,
    clickToReadyMs: 300,
  })

  it('accepts a soft LCP on the document title once its data is on screen', () => {
    expect(
      isMiscreditedDocumentOpen(
        documentOpen(310, 'h1 in [data-testid="document-panel-document-title"]', 'title'),
      ),
    ).toBe(false)
  })

  it('accepts an element Studio replaced before Chrome reported it, when it painted after the data', () => {
    expect(isMiscreditedDocumentOpen(documentOpen(312, '(detached)', 'other'))).toBe(false)
  })

  it('rejects a soft LCP that painted before the document data was on screen', () => {
    expect(isMiscreditedDocumentOpen(documentOpen(140, '(detached)', 'other'))).toBe(true)
  })

  it('rejects a soft LCP on pane chrome', () => {
    expect(
      isMiscreditedDocumentOpen(documentOpen(320, 'div in [data-testid="pane-header"]', 'other')),
    ).toBe(true)
  })

  it('rejects a document open with no paint credited to its click', () => {
    expect(isMiscreditedDocumentOpen(documentOpen(null, null, null))).toBe(true)
  })
})
