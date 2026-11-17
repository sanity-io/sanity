import {renderHook, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../../constants'
import {documentGroupInspector} from '../index'

describe('documentGroupInspector', () => {
  it('is named so the pane can open it from the menu and the onboarding hint', () => {
    expect(documentGroupInspector.name).toBe(DOCUMENT_GROUP_INSPECTOR_NAME)
  })

  it('offers a visible "Manage versions" menu item for opening the inspector', async () => {
    const {useMenuItem} = documentGroupInspector

    if (typeof useMenuItem === 'undefined') {
      throw new TypeError('Expected `documentGroupInspector` to declare `useMenuItem`')
    }

    const wrapper = await createTestProvider()
    const {result} = renderHook(
      () => useMenuItem({documentId: 'doc-123', documentType: 'author'}),
      {wrapper},
    )

    await waitFor(() => expect(result.current?.title).toBe('Manage versions'))
    expect(result.current.hidden).not.toBe(true)
    expect(result.current.icon).toBeDefined()
  })
})
