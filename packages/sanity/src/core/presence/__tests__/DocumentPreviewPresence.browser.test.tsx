import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {type DocumentPresence} from '../../store/presence/types'
import {DocumentPreviewPresence} from '../DocumentPreviewPresence'

vi.mock('../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))

const presence: Omit<DocumentPresence, 'path'>[] = [
  {
    user: {id: 'madison', displayName: 'Madison Baker'},
    sessionId: 'session-madison',
    documentId: 'drafts.article-1',
    lastActiveAt: '2026-11-17T10:00:00.000Z',
  },
  {
    user: {id: 'pedro', displayName: 'Pedro Hall'},
    sessionId: 'session-pedro',
    documentId: 'drafts.article-1',
    lastActiveAt: '2026-11-17T10:00:00.000Z',
  },
]

const TOOLTIP_TEXT = '2 people are editing this document right now'

async function hoverAvatars(tooltip?: boolean) {
  ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
    data: [] as ReleaseDocument[],
    byId: new Map<string, ReleaseDocument>(),
    loading: false,
    error: undefined,
  } as ReturnType<typeof useActiveReleases>)
  await render(
    <TestWrapper schemaTypes={[]}>
      <div style={{padding: 40}}>
        <DocumentPreviewPresence presence={presence} tooltip={tooltip} />
      </div>
    </TestWrapper>,
  )
  const stack = page.getByLabelText(TOOLTIP_TEXT)
  await expect.element(stack).toBeVisible()
  await stack.hover()
}

describe('DocumentPreviewPresence', () => {
  it('says who is editing in a tooltip on hover', async () => {
    await hoverAvatars()
    await expect.element(page.getByText(TOOLTIP_TEXT)).toBeVisible()
  })

  it('opens no tooltip when the tooltip is off, as on a list row with the versions flyout', async () => {
    await hoverAvatars(false)
    // Longer than the tooltip's open delay
    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(
      page
        .getByText(TOOLTIP_TEXT)
        .elements()
        .filter((element) => element.checkVisibility()),
    ).toHaveLength(0)
  })
})
