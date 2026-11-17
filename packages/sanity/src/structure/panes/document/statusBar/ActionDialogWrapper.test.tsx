import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ComponentType} from 'react'
import {type DocumentActionDescription, type DocumentActionDialogProps} from 'sanity'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {KeyboardShortcutResponder} from '../keyboardShortcuts/DocumentActionShortcuts'
import {ActionDialogWrapper} from './ActionMenuButton'

const DIALOG: DocumentActionDialogProps = {
  type: 'custom',
  component: <div data-testid="action-dialog">Confirm delete</div>,
}

let TestProvider: ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
  })
})

function ActionDialogWrapperHarness({dialog}: {dialog?: DocumentActionDescription['dialog']}) {
  return (
    <ActionDialogWrapper actionStates={[{label: 'Delete', dialog}]}>
      {({handleAction}) => (
        <button type="button" data-testid="open-action" onClick={() => handleAction(0)}>
          Delete
        </button>
      )}
    </ActionDialogWrapper>
  )
}

function KeyboardShortcutResponderHarness({
  activeIndex,
  dialog,
  onActionStart,
}: {
  activeIndex: number
  dialog?: DocumentActionDescription['dialog']
  onActionStart: (index: number) => void
}) {
  return (
    <KeyboardShortcutResponder
      actionsBoxElement={null}
      activeIndex={activeIndex}
      id="shortcuts"
      onActionStart={onActionStart}
      rootRef={null}
      states={[{label: 'Delete', dialog}]}
    >
      pane
    </KeyboardShortcutResponder>
  )
}

describe('ActionDialogWrapper', () => {
  it('clears leftover actionIndex when the dialog is dismissed so a later dialog mounts only once', async () => {
    const user = userEvent.setup()
    const {rerender} = render(<ActionDialogWrapperHarness dialog={DIALOG} />, {
      wrapper: TestProvider,
    })

    await user.click(screen.getByTestId('open-action'))
    expect(screen.getAllByTestId('action-dialog')).toHaveLength(1)

    rerender(<ActionDialogWrapperHarness dialog={false} />)
    expect(screen.queryByTestId('action-dialog')).not.toBeInTheDocument()

    rerender(<ActionDialogWrapperHarness dialog={DIALOG} />)
    expect(screen.queryByTestId('action-dialog')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('open-action'))
    expect(screen.getAllByTestId('action-dialog')).toHaveLength(1)
  })
})

describe('KeyboardShortcutResponder', () => {
  it('does not reset activeIndex before the dialog has mounted', () => {
    const onActionStart = vi.fn()
    render(
      <KeyboardShortcutResponderHarness
        activeIndex={0}
        dialog={false}
        onActionStart={onActionStart}
      />,
      {wrapper: TestProvider},
    )

    expect(screen.queryByTestId('action-dialog')).not.toBeInTheDocument()
    expect(onActionStart).not.toHaveBeenCalled()
  })

  it('resets activeIndex when the hosted action no longer has a dialog', () => {
    const onActionStart = vi.fn()
    const {rerender} = render(
      <KeyboardShortcutResponderHarness
        activeIndex={0}
        dialog={DIALOG}
        onActionStart={onActionStart}
      />,
      {wrapper: TestProvider},
    )

    expect(screen.getAllByTestId('action-dialog')).toHaveLength(1)

    rerender(
      <KeyboardShortcutResponderHarness
        activeIndex={0}
        dialog={false}
        onActionStart={onActionStart}
      />,
    )
    expect(screen.queryByTestId('action-dialog')).not.toBeInTheDocument()
    expect(onActionStart).toHaveBeenCalledWith(-1)

    rerender(
      <KeyboardShortcutResponderHarness
        activeIndex={-1}
        dialog={DIALOG}
        onActionStart={onActionStart}
      />,
    )
    expect(screen.queryByTestId('action-dialog')).not.toBeInTheDocument()
  })
})
