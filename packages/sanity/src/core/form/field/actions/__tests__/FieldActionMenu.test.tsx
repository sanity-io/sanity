import {EllipsisHorizontalIcon} from '@sanity/icons'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ComponentType, type PropsWithChildren} from 'react'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentFieldActionNode} from '../../../../config'
import {FieldActionMenu} from '../FieldActionMenu'

const mockNodes: DocumentFieldActionNode[] = [
  {
    type: 'group',
    children: [
      {
        type: 'action',
        icon: EllipsisHorizontalIcon,
        title: 'Copy',
        onAction: vi.fn(),
      },
    ],
    icon: EllipsisHorizontalIcon,
    title: 'Field actions',
  },
]

describe('FieldActionMenu', () => {
  let TestWrapper: ComponentType<PropsWithChildren>

  beforeAll(async () => {
    TestWrapper = await createTestProvider()
  })

  it('should prevent default on pointerdown to avoid scroll jump', () => {
    const onMenuOpenChange = vi.fn()

    render(
      <TestWrapper>
        <FieldActionMenu nodes={mockNodes} onMenuOpenChange={onMenuOpenChange} />
      </TestWrapper>,
    )

    const trigger = screen.getByTestId('field-actions-trigger')

    // Verify that pointerdown's default is prevented, which stops the browser
    // from performing focus-and-scroll behaviour when clicking the menu trigger.
    // eslint-disable-next-line testing-library/prefer-user-event -- fireEvent is needed to check preventDefault return value
    const defaultPrevented = !fireEvent.pointerDown(trigger)
    expect(defaultPrevented).toBe(true)
  })

  it('should still open the menu on click despite pointerdown prevention', () => {
    const onMenuOpenChange = vi.fn()

    render(
      <TestWrapper>
        <FieldActionMenu nodes={mockNodes} onMenuOpenChange={onMenuOpenChange} />
      </TestWrapper>,
    )

    const trigger = screen.getByTestId('field-actions-trigger')

    // Click the trigger button — the click event should still work even though
    // pointerdown default is prevented.
    // eslint-disable-next-line testing-library/prefer-user-event -- fireEvent used for consistency with pointerDown test
    fireEvent.click(trigger)

    // The menu should open
    expect(onMenuOpenChange).toHaveBeenCalledWith(true)
  })
})
