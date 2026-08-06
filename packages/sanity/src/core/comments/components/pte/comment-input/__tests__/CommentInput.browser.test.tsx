import {type PortableTextBlock} from '@sanity/types'
import {BoundaryElementProvider} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {CommentsInputStory} from './CommentInputStory'

/**
 * Simulates the short BoundaryElementProvider used around oneLine PTE fields
 * when authoring an inline comment (SAPP-4093). The comment input is not clipped
 * by this element; only the ambient floating boundary is short — matching how
 * CommentsPortableTextInput provides the PTE field root as boundary.
 */
function ShortBoundaryProvider(props: {children: ReactNode}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  return (
    <>
      <div ref={setElement} style={{height: 32, width: 400, overflow: 'hidden'}} />
      {element ? (
        <BoundaryElementProvider element={element}>{props.children}</BoundaryElementProvider>
      ) : null}
    </>
  )
}

describe('Comments', () => {
  describe('CommentInput', () => {
    it('Should render', async () => {
      void render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
    })

    it('Should be able to type into', async () => {
      const {insertPortableText} = testHelpers()
      void render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await insertPortableText('My first comment!', $editable)
      await expect.element($editable).toHaveTextContent('My first comment!')
    })

    it('Should bring up mentions menu when typing @', async () => {
      void render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await userEvent.keyboard('@')
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await expect.element($mentionsMenu).toBeVisible()
      await userEvent.keyboard('{Enter}')
      await expect.element($mentionsMenu).not.toBeInTheDocument()
      await expect.element(page.getByTestId('comment-mentions-loading-skeleton')).toBeVisible()
    })

    it('Should bring up mentions menu when pressing the @ button, whilst retaining focus on PTE', async () => {
      void render(<CommentsInputStory />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      const $mentionButton = page.getByTestId('comment-input-mention-button')
      await expect.element($mentionButton).toBeVisible()
      await userEvent.click($mentionButton)
      await expect.element(page.getByTestId('comments-mentions-menu')).toBeVisible()
      await expect.element($editable).toHaveFocus()
    })

    it('keeps mentions menu sized when ambient boundary is short (SAPP-4093)', async () => {
      void render(
        <ShortBoundaryProvider>
          <CommentsInputStory />
        </ShortBoundaryProvider>,
      )
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await userEvent.keyboard('@')
      const $mentionsMenu = page.getByTestId('comments-mentions-menu')
      await expect.element($mentionsMenu).toBeVisible()

      // Customer saw collapse ~250–300ms after open when constrainSize used the
      // short oneLine PTE boundary; wait past that window then assert size.
      await new Promise((resolve) => setTimeout(resolve, 400))
      await expect.element($mentionsMenu).toBeVisible()

      const rect = $mentionsMenu.element().getBoundingClientRect()
      expect(rect.width).toBeGreaterThan(0)
      expect(rect.height).toBeGreaterThan(0)
    })

    it('Should be able to submit', async () => {
      const {insertPortableText} = testHelpers()
      let resolve!: () => void
      const submitted = Object.assign(new Promise<void>((r) => (resolve = r)), {resolve})

      void render(<CommentsInputStory onSubmit={submitted.resolve} />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await userEvent.keyboard('{Enter}')
      await insertPortableText('This is a comment!', $editable)
      await expect.element($editable).toHaveTextContent('This is a comment!')
      const $sendButton = page.getByTestId('comment-input-send-button')
      await expect.element($sendButton).toBeEnabled()
      await userEvent.keyboard('{Enter}')
      await submitted
    })

    it('Should start the next comment empty after submitting the previous one', async () => {
      const {insertPortableText} = testHelpers()
      let resolve!: (value: PortableTextBlock[]) => void
      const submitted = new Promise<PortableTextBlock[]>((r) => (resolve = r))

      void render(<CommentsInputStory onSubmit={resolve} />)
      const $editable = page.getByTestId('comment-input-editable')
      await expect.element($editable).toBeVisible()
      await insertPortableText('First comment', $editable)
      await expect.element(page.getByTestId('comment-input-send-button')).toBeEnabled()
      // Submit while ' typed' still sits in the mutation debounce, so the
      // discarded instance's teardown flush carries it.
      await userEvent.keyboard(' typed')
      await userEvent.keyboard('{Enter}')
      expect(textOf(await submitted)).toBe('First comment typed')

      await expect.element($editable).not.toHaveTextContent('First comment')

      await insertPortableText('Second comment', $editable)
      await expect.element($editable).toHaveTextContent(/^Second comment$/)
    })
  })
})

function textOf(value: PortableTextBlock[]): string {
  return value
    .map((block) =>
      Array.isArray(block.children)
        ? block.children.map((child) => ('text' in child ? child.text : '')).join('')
        : '',
    )
    .join('\n')
}
