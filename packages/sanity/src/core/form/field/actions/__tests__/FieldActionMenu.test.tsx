import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ComponentType, type PropsWithChildren} from 'react'
import {beforeAll, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentFieldActionNode} from '../../../../config/document/fieldActions/types'
import {studioDefaultLocaleResources, studioLocaleStrings} from '../../../../i18n/bundles/studio'
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
    // oxlint-disable-next-line testing-library/prefer-user-event -- fireEvent is needed to check preventDefault return value
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
    // oxlint-disable-next-line testing-library/prefer-user-event -- fireEvent used for consistency with pointerDown test
    fireEvent.click(trigger)

    // The menu should open
    expect(onMenuOpenChange).toHaveBeenCalledWith(true)
  })

  it('should use the translated string for the overflow trigger accessible name', async () => {
    const onMenuOpenChange = vi.fn()
    const TranslatedWrapper = await createTestProvider({
      resources: [
        {
          ...studioDefaultLocaleResources,
          resources: {
            ...studioLocaleStrings,
            'form.field.actions-menu.title': 'Custom field actions label',
          },
        },
      ],
    })

    render(
      <TranslatedWrapper>
        <FieldActionMenu nodes={mockNodes} onMenuOpenChange={onMenuOpenChange} />
      </TranslatedWrapper>,
    )

    const trigger = screen.getByTestId('field-actions-trigger')
    expect(trigger).toHaveAttribute('aria-label', 'Custom field actions label')
    expect(screen.getByRole('button', {name: 'Custom field actions label'})).toBe(trigger)
  })
})
