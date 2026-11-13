import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {
  createSaveRejectedToast,
  formatDiscardedText,
  type LabelledText,
  SaveRejectedToastDescription,
} from '../SaveRejectedToastDescription'

const theme = buildTheme()

function renderDescription(discardedText: LabelledText[]) {
  render(
    <ThemeProvider theme={theme}>
      <SaveRejectedToastDescription
        description="“My article” has been reloaded."
        copyLabel="Copy discarded text"
        discardedText={discardedText}
      />
    </ThemeProvider>,
  )
}

describe('SaveRejectedToastDescription', () => {
  it('copies the discarded text, one value per paragraph', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})
    renderDescription([
      {label: 'Body', text: 'Hello world'},
      {label: 'Body', text: 'A new paragraph'},
    ])

    await userEvent.click(screen.getByRole('button', {name: 'Copy discarded text'}))

    expect(writeText).toHaveBeenCalledWith('Hello world\n\nA new paragraph')
  })

  it('offers no copy action when no text was discarded', () => {
    renderDescription([])

    expect(screen.getByText('“My article” has been reloaded.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('formatDiscardedText', () => {
  it('puts each field title above its text when several fields changed', () => {
    expect(
      formatDiscardedText([
        {label: 'Title', text: 'Hello world'},
        {label: 'Body', text: 'First'},
        {label: 'Body', text: 'Second'},
      ]),
    ).toBe('Title\n\nHello world\n\nBody\n\nFirst\n\nSecond')
  })
})

describe('createSaveRejectedToast', () => {
  it('keys the toast per document, so a rejection elsewhere keeps this one', () => {
    const toastFor = (documentId: string) =>
      createSaveRejectedToast({
        documentId,
        title: 'Not saved',
        description: 'Reloaded',
        copyLabel: 'Copy',
        discardedText: [],
      }).id
    expect([toastFor('article-1'), toastFor('article-2')]).toEqual([
      'document-store.save-rejected.article-1',
      'document-store.save-rejected.article-2',
    ])
  })
})
