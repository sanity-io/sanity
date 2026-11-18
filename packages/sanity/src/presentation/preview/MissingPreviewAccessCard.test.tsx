import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {studioDefaultLocaleResources} from '../../core/i18n/bundles/studio'
import {presentationUsEnglishLocaleBundle} from '../i18n'
import {MissingPreviewAccessCard} from './MissingPreviewAccessCard'

async function renderCard(props: Parameters<typeof MissingPreviewAccessCard>[0]) {
  const wrapper = await createTestProvider({
    resources: [studioDefaultLocaleResources, presentationUsEnglishLocaleBundle],
  })
  return render(<MissingPreviewAccessCard {...props} />, {wrapper})
}

describe('MissingPreviewAccessCard', () => {
  test('names the role that is missing access and how to get it', async () => {
    await renderCard({roles: [{name: 'viewer', title: 'Viewer'}], onContinueAnyway: vi.fn()})

    expect(await screen.findByText("You don't have access to the preview")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Your role (Viewer) can't open the preview with draft content. Ask a project administrator for a role that can edit documents, or to share this preview.",
      ),
    ).toBeInTheDocument()
  })

  test('lists every role the user has', async () => {
    await renderCard({
      roles: [
        {name: 'viewer', title: 'Viewer'},
        {name: 'custom-role', title: ''},
      ],
      onContinueAnyway: vi.fn(),
    })

    expect(await screen.findByText(/^Your role \(Viewer and custom-role\)/)).toBeInTheDocument()
  })

  test('falls back to a generic message without roles', async () => {
    await renderCard({roles: undefined, onContinueAnyway: vi.fn()})

    expect(
      await screen.findByText(
        "You don't have permission to open the preview with draft content. Ask a project administrator for a role that can edit documents, or to share this preview.",
      ),
    ).toBeInTheDocument()
  })

  test('continues to the preview without draft content', async () => {
    const onContinueAnyway = vi.fn()
    await renderCard({roles: [{name: 'viewer', title: 'Viewer'}], onContinueAnyway})

    await userEvent.click(await screen.findByRole('button', {name: 'Continue without drafts'}))
    expect(onContinueAnyway).toHaveBeenCalledOnce()
  })
})
