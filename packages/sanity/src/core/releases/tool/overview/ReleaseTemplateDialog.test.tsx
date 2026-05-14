import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../i18n'
import {type ReleaseDescriptionSection} from '../../store/createReleaseSettingsStore'
import {ReleaseTemplateDialog} from './ReleaseTemplateDialog'

const setDescriptionSectionsMock = vi.fn().mockResolvedValue(undefined)

const useReleaseSettingsMock = vi.fn(() => ({
  descriptionSections: [] as ReleaseDescriptionSection[],
  loading: false,
  error: null as Error | null,
  setDescriptionSections: setDescriptionSectionsMock,
}))

vi.mock('../../store/useReleaseSettings', () => ({
  useReleaseSettings: () => useReleaseSettingsMock(),
}))

function mockSections(descriptionSections: ReleaseDescriptionSection[]): void {
  useReleaseSettingsMock.mockImplementation(() => ({
    descriptionSections,
    loading: false,
    error: null,
    setDescriptionSections: setDescriptionSectionsMock,
  }))
}

async function renderDialog(onClose: () => void = vi.fn()) {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(<ReleaseTemplateDialog onClose={onClose} />, {wrapper})
}

describe('ReleaseTemplateDialog', () => {
  beforeEach(() => {
    setDescriptionSectionsMock.mockReset()
    setDescriptionSectionsMock.mockResolvedValue(undefined)
    useReleaseSettingsMock.mockReset()
    mockSections([])
  })

  it('renders the header from the i18n bundle', async () => {
    await renderDialog()
    expect(await screen.findByText('Release template')).toBeInTheDocument()
  })

  it('renders the description copy', async () => {
    await renderDialog()
    expect(
      await screen.findByText(
        'Each title becomes a heading in the AI-generated release description.',
      ),
    ).toBeInTheDocument()
  })

  it('renders one empty section input on first open when no sections exist', async () => {
    await renderDialog()
    const firstInput = (await screen.findByTestId(
      'release-template-section-input-0',
    )) as HTMLInputElement
    expect(firstInput.value).toBe('')
    expect(screen.queryByTestId('release-template-section-input-1')).toBeNull()
  })

  it('seeds rows with persisted descriptionSections when present', async () => {
    mockSections([{title: 'Overview'}, {title: 'Changes'}])
    await renderDialog()
    const firstInput = (await screen.findByTestId(
      'release-template-section-input-0',
    )) as HTMLInputElement
    const secondInput = (await screen.findByTestId(
      'release-template-section-input-1',
    )) as HTMLInputElement
    await waitFor(() => {
      expect(firstInput.value).toBe('Overview')
      expect(secondInput.value).toBe('Changes')
    })
  })

  it('typing into a row fires setDescriptionSections with the new title', async () => {
    await renderDialog()
    const firstInput = await screen.findByTestId('release-template-section-input-0')
    await userEvent.type(firstInput, 'Hi')
    await waitFor(() => {
      expect(setDescriptionSectionsMock).toHaveBeenLastCalledWith([{title: 'Hi'}])
    })
  })

  it('clicking Add section appends a new empty row', async () => {
    await renderDialog()
    const addButton = await screen.findByTestId('release-template-add-section')
    await userEvent.click(addButton)
    await waitFor(() => {
      expect(setDescriptionSectionsMock).toHaveBeenLastCalledWith([{title: ''}, {title: ''}])
    })
  })

  it('clicking Delete removes that section', async () => {
    mockSections([{title: 'Overview'}, {title: 'Changes'}])
    await renderDialog()
    const deleteFirst = await screen.findByTestId('release-template-section-delete-0')
    await userEvent.click(deleteFirst)
    await waitFor(() => {
      expect(setDescriptionSectionsMock).toHaveBeenLastCalledWith([{title: 'Changes'}])
    })
  })

  it('disables Add section when 8 sections exist', async () => {
    mockSections(Array.from({length: 8}, (_unused, index) => ({title: `Section ${index + 1}`})))
    await renderDialog()
    const addButton = (await screen.findByTestId(
      'release-template-add-section',
    )) as HTMLButtonElement
    await waitFor(() => {
      expect(addButton.disabled).toBe(true)
    })
  })

  it('hides the hint textarea by default and reveals it when the toggle is clicked', async () => {
    mockSections([{title: 'Overview'}])
    await renderDialog()

    expect(screen.queryByTestId('release-template-section-hint-input-0')).toBeNull()

    const toggle = await screen.findByTestId('release-template-section-hint-toggle-0')
    await userEvent.click(toggle)

    expect(await screen.findByTestId('release-template-section-hint-input-0')).toBeInTheDocument()

    await userEvent.click(toggle)
    await waitFor(() => {
      expect(screen.queryByTestId('release-template-section-hint-input-0')).toBeNull()
    })
  })

  it('typing into a hint textarea fires setDescriptionSections with the new hint value', async () => {
    mockSections([{title: 'Risks'}])
    await renderDialog()

    const toggle = await screen.findByTestId('release-template-section-hint-toggle-0')
    await userEvent.click(toggle)

    const hintInput = await screen.findByTestId('release-template-section-hint-input-0')
    await userEvent.type(hintInput, 'Focus on prod')

    await waitFor(() => {
      expect(setDescriptionSectionsMock).toHaveBeenLastCalledWith([
        {title: 'Risks', hint: 'Focus on prod'},
      ])
    })
  })

  it('opens the hint textarea expanded for rows that already have a non-empty hint', async () => {
    mockSections([{title: 'Overview'}, {title: 'Risks', hint: 'Focus on production impact only'}])
    await renderDialog()

    expect(screen.queryByTestId('release-template-section-hint-input-0')).toBeNull()
    const seededHint = (await screen.findByTestId(
      'release-template-section-hint-input-1',
    )) as HTMLTextAreaElement
    expect(seededHint.value).toBe('Focus on production impact only')
  })

  it('recomputes hint expansion when a row is deleted so stale indices do not leak', async () => {
    mockSections([{title: 'Overview'}, {title: 'Risks', hint: 'Focus on production impact only'}])
    await renderDialog()

    expect(await screen.findByTestId('release-template-section-hint-input-1')).toBeInTheDocument()

    const deleteFirst = await screen.findByTestId('release-template-section-delete-0')
    await userEvent.click(deleteFirst)

    await waitFor(() => {
      expect(
        (screen.getByTestId('release-template-section-hint-input-0') as HTMLTextAreaElement).value,
      ).toBe('Focus on production impact only')
    })
    expect(screen.queryByTestId('release-template-section-hint-input-1')).toBeNull()
  })
})
