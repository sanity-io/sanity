import {renderHook} from '@testing-library/react'
import {type DocumentActionProps} from 'sanity'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {type DocumentPaneContextValue} from '../panes/document/DocumentPaneContext'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {useHistoryRestoreAction} from './HistoryRestoreAction'

vi.mock('../panes/document/useDocumentPane')

vi.mock('sanity', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>
  return {
    ...original,
    useDocumentOperation: () => ({restore: {execute: vi.fn(), disabled: false}}),
    useDocumentOperationEvent: () => null,
    useCurrentUser: () => null,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

vi.mock('sanity/router', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>
  return {
    ...original,
    useRouter: () => ({navigateIntent: vi.fn()}),
  }
})

const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>

const displayed = {
  _id: 'drafts.doc-1',
  _type: 'readOnlyTest',
  title: 'Title A',
}

function restoreActionProps(revision?: string): DocumentActionProps {
  return {id: 'doc-1', type: 'readOnlyTest', revision} as DocumentActionProps
}

function paneValue(overrides: Partial<DocumentPaneContextValue> = {}): DocumentPaneContextValue {
  return {
    revisionNotFound: false,
    targetDocumentState: {status: 'ready', scopeId: undefined},
    schemaType: {
      name: 'readOnlyTest',
      title: 'Read only test',
      jsonType: 'object',
      fields: [],
    },
    displayed,
    ...overrides,
  } as DocumentPaneContextValue
}

describe('useHistoryRestoreAction', () => {
  beforeEach(() => {
    mockUseDocumentPane.mockReset()
  })

  it('disables restore when the document schema is read-only', () => {
    mockUseDocumentPane.mockReturnValue(
      paneValue({
        schemaType: {
          name: 'readOnlyTest',
          title: 'Read only test',
          jsonType: 'object',
          fields: [],
          readOnly: true,
        } as DocumentPaneContextValue['schemaType'],
      }),
    )

    const {result} = renderHook(() => useHistoryRestoreAction(restoreActionProps('rev-1')))

    expect(result.current).toMatchObject({
      label: 'action.restore.label',
      disabled: true,
      title: 'action.restore.disabled.read-only',
    })
  })

  it('disables restore when the update action is not enabled', () => {
    mockUseDocumentPane.mockReturnValue(
      paneValue({
        schemaType: {
          name: 'readOnlyTest',
          title: 'Read only test',
          jsonType: 'object',
          fields: [],
          __experimental_actions: ['create', 'publish'],
        } as DocumentPaneContextValue['schemaType'],
      }),
    )

    const {result} = renderHook(() => useHistoryRestoreAction(restoreActionProps('rev-1')))

    expect(result.current).toMatchObject({
      disabled: true,
      title: 'action.restore.disabled.read-only',
    })
  })

  it('leaves restore enabled for a writable document on an older revision', () => {
    mockUseDocumentPane.mockReturnValue(paneValue())

    const {result} = renderHook(() => useHistoryRestoreAction(restoreActionProps('rev-1')))

    expect(result.current).toMatchObject({
      label: 'action.restore.label',
      disabled: false,
      title: 'action.restore.tooltip',
    })
  })

  it('hides restore when viewing the latest revision', () => {
    mockUseDocumentPane.mockReturnValue(paneValue())

    const {result} = renderHook(() => useHistoryRestoreAction(restoreActionProps()))

    expect(result.current).toBeNull()
  })
})
