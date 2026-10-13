import {type SanityDocument, type ValidationMarker} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useImmediateValidation} from 'sanity'
import {beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../i18n'
import {type PublishPhase, PublishProgressDialog} from '../PublishProgressDialog'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useImmediateValidation: vi.fn(),
}))

const mockUseImmediateValidation = useImmediateValidation as Mock<typeof useImmediateValidation>

const DRAFT: SanityDocument = {
  _id: 'drafts.author-1',
  _type: 'author',
  _rev: 'draft-1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
}
const REQUIRED_NAME: ValidationMarker = {level: 'error', message: 'Required', path: ['name']}
const RUNNING = {isValidating: true, validation: [], revision: 'draft-1'}
const PASSED = {isValidating: false, validation: [], revision: 'draft-1'}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
})

function step(testId: string) {
  const element = screen.getByTestId(testId)
  return {status: element.getAttribute('data-status'), text: element.textContent}
}

async function renderDialog(phase: PublishPhase, errorCount = 0) {
  const onValidation = vi.fn()
  const onClose = vi.fn()
  const element = (p: PublishPhase, count: number) => (
    <PublishProgressDialog
      phase={p}
      errorCount={count}
      validationTarget={DRAFT}
      requirePublishedReferences
      onValidation={onValidation}
      onClose={onClose}
    />
  )
  const rendered = render(element(phase, errorCount), {wrapper})
  // the test provider may suspend on its first render
  await screen.findByTestId('publish-progress-validation')
  return {
    onValidation,
    onClose,
    rerender: (p: PublishPhase, count = 0) => rendered.rerender(element(p, count)),
    unmount: rendered.unmount,
  }
}

describe('PublishProgressDialog', () => {
  beforeEach(() => {
    mockUseImmediateValidation.mockReturnValue(null)
  })

  it('validates the document on its own while validating, and reports the run', async () => {
    mockUseImmediateValidation.mockReturnValue(RUNNING)
    const {onValidation, rerender} = await renderDialog('validating')

    expect(mockUseImmediateValidation).toHaveBeenLastCalledWith(DRAFT, true, true)
    expect(onValidation).toHaveBeenLastCalledWith(RUNNING)
    expect(step('publish-progress-validation')).toEqual({
      status: 'running',
      text: 'Validating your document',
    })
    expect(step('publish-progress-publish')).toEqual({
      status: 'pending',
      text: 'Publishing document',
    })
    expect(screen.queryByTestId('cancel-button')).toBeNull()

    mockUseImmediateValidation.mockReturnValue(PASSED)
    rerender('validating')
    expect(onValidation).toHaveBeenLastCalledWith(PASSED)
  })

  it('stops its run once the publish is on, and shows the publish step running', async () => {
    mockUseImmediateValidation.mockReturnValue(RUNNING)
    const {onValidation, rerender} = await renderDialog('validating')

    mockUseImmediateValidation.mockReturnValue(null)
    rerender('publishing')

    expect(mockUseImmediateValidation).toHaveBeenLastCalledWith(DRAFT, true, false)
    expect(onValidation).toHaveBeenLastCalledWith(null)
    expect(step('publish-progress-validation').status).toBe('succeeded')
    expect(step('publish-progress-publish')).toEqual({
      status: 'running',
      text: 'Publishing document',
    })
    expect(screen.queryByTestId('cancel-button')).toBeNull()

    rerender('published')
    expect(step('publish-progress-publish').status).toBe('succeeded')
  })

  it('keeps its run while it is the one that found the errors, and offers to close', async () => {
    const failed = {
      isValidating: false,
      validation: [REQUIRED_NAME, REQUIRED_NAME],
      revision: 'draft-1',
    }
    mockUseImmediateValidation.mockReturnValue(failed)
    const {onClose, rerender} = await renderDialog('validating')

    rerender('validation-failed', 2)

    expect(mockUseImmediateValidation).toHaveBeenLastCalledWith(DRAFT, true, true)
    expect(step('publish-progress-validation')).toEqual({status: 'failed', text: '2 errors'})
    expect(step('publish-progress-publish').status).toBe('pending')
    await userEvent.click(screen.getByTestId('cancel-button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows a failed publish and offers to close', async () => {
    const {onClose} = await renderDialog('publish-failed')

    expect(step('publish-progress-validation').status).toBe('succeeded')
    expect(step('publish-progress-publish')).toEqual({
      status: 'failed',
      text: 'Publishing failed',
    })
    await userEvent.click(screen.getByTestId('cancel-button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('takes its run back when it goes away', async () => {
    mockUseImmediateValidation.mockReturnValue(PASSED)
    const {onValidation, unmount} = await renderDialog('validating')
    expect(onValidation).toHaveBeenLastCalledWith(PASSED)

    unmount()

    expect(onValidation).toHaveBeenLastCalledWith(null)
  })
})
