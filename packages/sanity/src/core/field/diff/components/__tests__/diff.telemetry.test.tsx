import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type FieldChangeNode, type GroupChangeNode} from '../../../types'
import {DocumentChangesReverted} from '../../__telemetry__/diff.telemetry'
import {ChangeList} from '../ChangeList'
import {GroupChange} from '../ChangeResolver'
import {FieldChange} from '../FieldChange'

interface MockChangeNode {
  key: string
  type: 'field' | 'group'
  path: string[]
  titlePath?: string[]
  changes?: MockChangeNode[]
}

const mockTelemetryLog = vi.hoisted(() => vi.fn())
const mockUndoChange = vi.hoisted(() => vi.fn())
const mockBuildObjectChangeList = vi.hoisted(() =>
  vi.fn((): MockChangeNode[] => [
    {
      key: 'root',
      type: 'group',
      path: [],
      titlePath: [],
      changes: [
        {key: 'a', type: 'field', path: ['a']},
        {key: 'b', type: 'field', path: ['b']},
      ],
    },
  ]),
)

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: mockTelemetryLog}),
}))

function FieldWrapper({children}: {children: React.ReactNode}) {
  return children
}

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
  useConditionalProperty: ({checkProperty}: {checkProperty?: unknown}) => checkProperty === true,
}))

vi.mock('../../changes/undoChange', () => ({
  undoChange: mockUndoChange,
}))

vi.mock('../../changes/buildChangeList', () => ({
  buildObjectChangeList: mockBuildObjectChangeList,
}))

function RevertChangesConfirmDialogStub({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div>
      <button type="button" data-testid="confirm-revert" onClick={onConfirm}>
        confirm
      </button>
      <button type="button" data-testid="cancel-revert" onClick={onCancel}>
        cancel
      </button>
    </div>
  )
}

// Render only the confirm/cancel controls so the revert flow can be driven without the popover.
vi.mock('../RevertChangesConfirmDialog', () => ({
  RevertChangesConfirmDialog: RevertChangesConfirmDialogStub,
}))

function ChangeResolverStub() {
  return null
}

// `GroupChange` shares a module with `ChangeResolver`, so only the resolver is stubbed out
vi.mock(import('../ChangeResolver'), async (importOriginal) => ({
  ...(await importOriginal()),
  ChangeResolver: ChangeResolverStub,
}))

function ChangeBreadcrumbStub() {
  return null
}

vi.mock('../ChangeBreadcrumb', () => ({ChangeBreadcrumb: ChangeBreadcrumbStub}))

function ValueErrorStub() {
  return null
}

vi.mock('../ValueError', () => ({ValueError: ValueErrorStub}))

function DiffInspectWrapperStub({children}: {children: React.ReactNode}) {
  return <div>{children}</div>
}

vi.mock('../DiffInspectWrapper', () => ({DiffInspectWrapper: DiffInspectWrapperStub}))

function RevertChangesButtonStub() {
  return null
}

vi.mock('../RevertChangesButton', () => ({RevertChangesButton: RevertChangesButtonStub}))

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('revert telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    it('logs scope "all" with the flat leaf change count on confirm', async () => {
      renderChangeList()

      await userEvent.click(screen.getByTestId('confirm-revert'))

      expect(mockTelemetryLog).toHaveBeenCalledWith(DocumentChangesReverted, {
        scope: 'all',
        changeCount: 2,
      })
      expect(mockUndoChange).toHaveBeenCalledTimes(1)
    })

    it('counts flat leaf changes, not direct children, when a group nests another group', async () => {
      mockBuildObjectChangeList.mockReturnValueOnce([
        {
          key: 'root',
          type: 'group',
          path: [],
          titlePath: [],
          changes: [
            {key: 'a', type: 'field', path: ['a']},
            {
              key: 'nested',
              type: 'group',
              path: ['nested'],
              titlePath: [],
              changes: [
                {key: 'b', type: 'field', path: ['nested', 'b']},
                {key: 'c', type: 'field', path: ['nested', 'c']},
              ],
            },
          ],
        },
      ])

      renderChangeList()

      await userEvent.click(screen.getByTestId('confirm-revert'))

      expect(mockTelemetryLog).toHaveBeenCalledWith(DocumentChangesReverted, {
        scope: 'all',
        changeCount: 3,
      })
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
      // The nested changes are hidden so the group's own revert controls are the only ones rendered.
      changes: [
        {
          key: 'c1',
          type: 'field',
          path: ['c1'],
          diff: {},
          schemaType: {jsonType: 'string', hidden: true},
        },
        {
          key: 'c2',
          type: 'field',
          path: ['c2'],
          diff: {},
          schemaType: {jsonType: 'string', hidden: true},
        },
      ],
    } as unknown as GroupChangeNode

    it('logs scope "group" with the group change count on confirm', async () => {
      render(<GroupChange change={group} />, {wrapper})

      await userEvent.click(screen.getByTestId('confirm-revert'))

      expect(mockTelemetryLog).toHaveBeenCalledWith(DocumentChangesReverted, {
        scope: 'group',
        changeCount: 2,
      })
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

      expect(mockTelemetryLog).toHaveBeenCalledWith(DocumentChangesReverted, {
        scope: 'field',
        changeCount: 1,
      })
    })
  })
})
