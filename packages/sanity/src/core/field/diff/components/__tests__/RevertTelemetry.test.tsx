import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ForwardedRef, forwardRef} from 'react'
import {beforeAll, beforeEach, describe, expect, expectTypeOf, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type FieldChangeNode, type GroupChangeNode} from '../../../types'
import {type DocumentChangesRevertedInfo} from '../../__telemetry__/diff.telemetry'
import {ChangeList} from '../ChangeList'
import {FieldChange} from '../FieldChange'
import {GroupChange} from '../GroupChange'

const mockTelemetryLog = vi.hoisted(() => vi.fn())
const mockUndoChange = vi.hoisted(() => vi.fn())

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: mockTelemetryLog}),
}))

const FieldWrapper = ({children}: {children: React.ReactNode}) => children

vi.mock('../../hooks/useDocumentChange', () => ({
  useDocumentChange: () => ({
    documentId: 'doc-1',
    schemaType: {name: 'article', jsonType: 'object'},
    rootDiff: {},
    isComparingCurrent: true,
    value: {_id: 'doc-1'},
    FieldWrapper,
  }),
}))

vi.mock('../../../../hooks/useTargetDocumentState', () => ({
  useTargetDocumentState: () => ({status: 'ready'}),
  getPairTarget: () => undefined,
  getTargetScopeId: () => undefined,
}))

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: () => ({}),
}))

vi.mock('../../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: () => [{granted: true}, false],
}))

vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../../conditional-property/useConditionalProperty', () => ({
  useConditionalProperty: () => false,
}))

vi.mock('../../changes/undoChange', () => ({
  undoChange: mockUndoChange,
}))

vi.mock('../../changes/buildChangeList', () => ({
  buildObjectChangeList: () => [
    {key: 'a', type: 'field', path: ['a']},
    {key: 'b', type: 'field', path: ['b']},
  ],
}))

// Render only the confirm/cancel controls so the revert flow can be driven without the popover.
vi.mock('../RevertChangesConfirmDialog', () => ({
  RevertChangesConfirmDialog: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: () => void
    onCancel: () => void
  }) => (
    <div>
      <button type="button" data-testid="confirm-revert" onClick={onConfirm}>
        confirm
      </button>
      <button type="button" data-testid="cancel-revert" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}))

vi.mock('../ChangeResolver', () => ({ChangeResolver: () => null}))
vi.mock('../ChangeBreadcrumb', () => ({ChangeBreadcrumb: () => null}))
vi.mock('../ValueError', () => ({ValueError: () => null}))
vi.mock('../DiffInspectWrapper', () => ({
  DiffInspectWrapper: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}))
vi.mock('../RevertChangesButton', () => ({
  RevertChangesButton: forwardRef(function RevertChangesButton(
    _props,
    _ref: ForwardedRef<HTMLButtonElement>,
  ) {
    return null
  }),
}))

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('revert telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('constrains the reverted scope to the defined union', () => {
    expectTypeOf<DocumentChangesRevertedInfo['scope']>().toEqualTypeOf<'all' | 'group' | 'field'>()
  })

  describe('ChangeList (revert all)', () => {
    const renderChangeList = () =>
      render(
        <ChangeList
          diff={{} as never}
          schemaType={{name: 'article', jsonType: 'object'} as never}
        />,
        {wrapper},
      )

    it('logs scope "all" with the total change count on confirm', async () => {
      renderChangeList()

      await userEvent.click(screen.getByTestId('confirm-revert'))

      expect(mockTelemetryLog).toHaveBeenCalledWith(
        expect.objectContaining({name: 'Document Changes Reverted'}),
        {scope: 'all', changeCount: 2},
      )
      expect(mockUndoChange).toHaveBeenCalledTimes(1)
    })

    it('logs nothing when the revert is cancelled', async () => {
      renderChangeList()

      await userEvent.click(screen.getByTestId('cancel-revert'))

      expect(mockTelemetryLog).not.toHaveBeenCalled()
      expect(mockUndoChange).not.toHaveBeenCalled()
    })
  })

  describe('GroupChange (revert group)', () => {
    const group = {
      type: 'group',
      key: 'group-key',
      path: [],
      titlePath: [],
      changes: [
        {key: 'c1', type: 'field', path: ['c1'], schemaType: {jsonType: 'string'}},
        {key: 'c2', type: 'field', path: ['c2'], schemaType: {jsonType: 'string'}},
      ],
    } as unknown as GroupChangeNode

    it('logs scope "group" with the group change count on confirm', async () => {
      render(<GroupChange change={group} />, {wrapper})

      await userEvent.click(screen.getByTestId('confirm-revert'))

      expect(mockTelemetryLog).toHaveBeenCalledWith(
        expect.objectContaining({name: 'Document Changes Reverted'}),
        {scope: 'group', changeCount: 2},
      )
    })

    it('logs nothing when the revert is cancelled', async () => {
      render(<GroupChange change={group} />, {wrapper})

      await userEvent.click(screen.getByTestId('cancel-revert'))

      expect(mockTelemetryLog).not.toHaveBeenCalled()
    })
  })

  describe('FieldChange (revert field)', () => {
    const change = {
      type: 'field',
      key: 'field-key',
      path: [],
      titlePath: [],
      showHeader: false,
      error: {} as never,
      diff: {} as never,
      schemaType: {name: 'title', jsonType: 'string'},
    } as unknown as FieldChangeNode

    it('logs scope "field" with a change count of one on confirm', async () => {
      render(<FieldChange change={change} />, {wrapper})

      await userEvent.click(screen.getByTestId('confirm-revert'))

      expect(mockTelemetryLog).toHaveBeenCalledWith(
        expect.objectContaining({name: 'Document Changes Reverted'}),
        {scope: 'field', changeCount: 1},
      )
    })

    it('logs nothing when the revert is cancelled', async () => {
      render(<FieldChange change={change} />, {wrapper})

      await userEvent.click(screen.getByTestId('cancel-revert'))

      expect(mockTelemetryLog).not.toHaveBeenCalled()
    })
  })
})
