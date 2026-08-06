import {type CurrentUser, type PortableTextBlock} from '@sanity/types'
import {BoundaryElementProvider} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type UserListWithPermissionsHookValue} from '../../../../../hooks/useUserListWithPermissions'
import {InlineCommentInputPopover} from '../../../../plugin/input/components/InlineCommentInputPopover'

const currentUser: CurrentUser = {
  email: '',
  id: '',
  name: '',
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  role: '',
  roles: [],
  profileImage: '',
  provider: '',
}

const SCHEMA_TYPES: [] = []

const MENTION_DATA: UserListWithPermissionsHookValue = {
  data: [
    {
      id: 'l33t',
      displayName: 'Test Person',
      email: 'test@test.com',
      granted: true,
    },
  ],
  loading: false,
  error: null,
}

/**
 * Stands in for a `oneLine` Portable Text field: the commented text sits in a
 * field root that is a single line tall, and that root is the boundary element
 * the composer inherits.
 */
function InlineComposerStory() {
  const [value, setValue] = useState<PortableTextBlock[] | null>(null)
  const [fieldElement, setFieldElement] = useState<HTMLDivElement | null>(null)
  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null)
  const [closed, setClosed] = useState(false)

  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <div data-testid="outside-area" style={{padding: 40}}>
        Outside
      </div>
      <div ref={setFieldElement} style={{height: 24, overflow: 'hidden'}}>
        <span ref={setReferenceElement}>Commented text</span>
      </div>
      <BoundaryElementProvider element={fieldElement}>
        {referenceElement && !closed ? (
          <InlineCommentInputPopover
            currentUser={currentUser}
            mentionOptions={MENTION_DATA}
            onChange={setValue}
            onClickOutside={() => setClosed(true)}
            onDiscardConfirm={noop}
            onSubmit={noop}
            referenceElement={referenceElement}
            value={value}
          />
        ) : null}
      </BoundaryElementProvider>
    </TestWrapper>
  )
}

describe('Inline comment composer', () => {
  it('keeps the mentions menu sized when the field boundary is one line tall (SAPP-4093)', async () => {
    void render(<InlineComposerStory />)

    const $editable = page.getByTestId('comment-input-editable')
    await expect.element($editable).toBeVisible()
    await userEvent.keyboard('@')

    const $mentionsMenu = page.getByTestId('comments-mentions-menu')
    await expect.element($mentionsMenu).toBeVisible()

    // The menu opened at a usable size and collapsed shortly after, once the
    // floating position had been measured against the field boundary.
    await new Promise((resolve) => setTimeout(resolve, 400))
    await expect.element($mentionsMenu).toBeVisible()

    const rect = $mentionsMenu.element().getBoundingClientRect()
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.height).toBeGreaterThan(0)
  })

  it('does not treat picking a mention as a click outside the composer', async () => {
    void render(<InlineComposerStory />)

    const $editable = page.getByTestId('comment-input-editable')
    await expect.element($editable).toBeVisible()
    await userEvent.keyboard('@')

    const $mentionsMenu = page.getByTestId('comments-mentions-menu')
    await expect.element($mentionsMenu).toBeVisible()
    await userEvent.click($mentionsMenu.getByRole('button'))

    await expect.element(page.getByTestId('comment-mentions-loading-skeleton')).toBeVisible()
    await expect.element(page.getByText('Discard comment?')).not.toBeInTheDocument()
    await expect.element($editable).toBeVisible()
  })

  it('asks to discard when clicking outside the composer with a draft value', async () => {
    const {insertPortableText} = testHelpers()
    void render(<InlineComposerStory />)

    const $editable = page.getByTestId('comment-input-editable')
    await expect.element($editable).toBeVisible()
    await insertPortableText('hello', $editable)
    await expect.element($editable).toHaveTextContent('hello')
    // The draft value has reached the composer once submitting is possible.
    await expect.element(page.getByTestId('comment-input-send-button')).toBeEnabled()

    await userEvent.click(page.getByTestId('outside-area'))
    await expect.element(page.getByText('Discard comment?')).toBeVisible()
  })
})
