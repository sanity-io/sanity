import {renderHook} from '@testing-library/react'
import {type DocumentInspector} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../../constants'
import {useDocumentGroupInspectorState} from '../useDocumentGroupInspectorState'

const documentGroupInspector: DocumentInspector = {
  name: DOCUMENT_GROUP_INSPECTOR_NAME,
  component: () => null,
}

const otherInspector: DocumentInspector = {
  name: 'test/other-inspector',
  component: () => null,
}

function renderState(currentInspector: DocumentInspector | undefined) {
  const openInspector = vi.fn()
  const closeInspector = vi.fn()
  const {result} = renderHook(() =>
    useDocumentGroupInspectorState({currentInspector, openInspector, closeInspector}),
  )

  return {result, openInspector, closeInspector}
}

describe('useDocumentGroupInspectorState', () => {
  it('is active only while the document group inspector is open', () => {
    expect(renderState(undefined).result.current.isDocumentGroupInventoryActive).toBe(false)
    expect(renderState(otherInspector).result.current.isDocumentGroupInventoryActive).toBe(false)
    expect(renderState(documentGroupInspector).result.current.isDocumentGroupInventoryActive).toBe(
      true,
    )
  })

  it('opens the document group inspector when activated', () => {
    const {result, openInspector, closeInspector} = renderState(otherInspector)

    result.current.setIsDocumentGroupInventoryActive(true)

    expect(openInspector).toHaveBeenCalledWith(DOCUMENT_GROUP_INSPECTOR_NAME)
    expect(closeInspector).not.toHaveBeenCalled()
  })

  it('closes the document group inspector when deactivated', () => {
    const {result, openInspector, closeInspector} = renderState(documentGroupInspector)

    result.current.setIsDocumentGroupInventoryActive(false)

    expect(closeInspector).toHaveBeenCalledWith(DOCUMENT_GROUP_INSPECTOR_NAME)
    expect(openInspector).not.toHaveBeenCalled()
  })

  it('leaves another open inspector alone when deactivated', () => {
    const {result, closeInspector} = renderState(otherInspector)

    result.current.setIsDocumentGroupInventoryActive(false)

    expect(closeInspector).not.toHaveBeenCalled()
  })
})
