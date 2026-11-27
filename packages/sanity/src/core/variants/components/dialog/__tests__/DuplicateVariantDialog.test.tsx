import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {act, render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  scheduledRelease,
} from '../../../../releases/__fixtures__/release.fixture'
import {createMockDocumentInVariant} from '../../../__fixtures__/createMockDocumentInVariant'
import {createMockVariantsStore} from '../../../__fixtures__/createMockVariantsStore'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentInVariant} from '../../../tool/detail/types'
import {type EditableSystemVariant, type SystemVariant} from '../../../types'
import {DuplicateVariantDialog} from '../DuplicateVariantDialog'

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

const variantDocumentOperationsMock = vi.hoisted(() => ({
  createVariantDocument: vi.fn(),
  duplicateVariantDocuments: vi.fn(),
}))

const toastMock = vi.hoisted(() => ({
  push: vi.fn(),
}))

const variantsMock = vi.hoisted(() => ({
  data: [] as SystemVariant[],
  byId: new Map<string, SystemVariant>(),
  loading: false,
  error: undefined as Error | undefined,
}))

const documentsMock = vi.hoisted(() => ({
  loading: false,
  results: [] as DocumentInVariant[],
  error: null as Error | null,
}))

const releasesMock = vi.hoisted(() => ({
  data: [] as ReleaseDocument[],
  byId: new Map<string, ReleaseDocument>(),
  loading: false,
  error: undefined,
}))

vi.mock('@sanity/ui/toast', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

vi.mock('../../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

vi.mock('../../../hooks/useVariantDocumentOperations', () => ({
  useVariantDocumentOperations: vi.fn(() => variantDocumentOperationsMock),
}))

let variantsStore = createMockVariantsStore()

vi.mock('../../../store/useVariantsStore', () => ({
  useVariantsStore: vi.fn(() => variantsStore.store),
}))

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => variantsMock),
}))

vi.mock('../../../hooks/useVariantDocuments', () => ({
  useVariantDocuments: vi.fn(() => documentsMock),
}))

vi.mock('../../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => releasesMock),
}))

// The test studio's client answers every query with `null`, so previews would never resolve.
vi.mock('../../../../tasks/hooks/useDocumentPreviewValues', () => ({
  useDocumentPreviewValues: vi.fn(() => ({isLoading: false, value: {title: 'Spring launch'}})),
}))

function documentVersion(options: {documentId: string; groupId: string; bundleId?: string}) {
  return createMockDocumentInVariant({...options, variantId: variantAlphaAudience._id})
}

// One document with a published version and a draft on top, one in an active release and one in a
// scheduled release: the draft and the release version are copied, the scheduled one is skipped.
const DOCUMENTS = [
  documentVersion({documentId: 'versions.scope-pub.article-1', groupId: 'article-1'}),
  documentVersion({
    documentId: 'drafts.scope-draft.article-1',
    groupId: 'article-1',
    bundleId: 'drafts',
  }),
  documentVersion({
    documentId: 'versions.rASAP.scope.article-2',
    groupId: 'article-2',
    bundleId: 'rASAP',
  }),
  documentVersion({
    documentId: 'versions.rScheduled.scope.article-3',
    groupId: 'article-3',
    bundleId: 'rScheduled',
  }),
]

describe('DuplicateVariantDialog', () => {
  const onCancel = vi.fn()
  const onDuplicated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    variantsMock.data = [variantAlphaAudience, variantNorwegianMarket]
    variantsMock.byId = new Map(variantsMock.data.map((variant) => [variant._id, variant]))
    documentsMock.loading = false
    documentsMock.results = []
    documentsMock.error = null
    releasesMock.data = [activeASAPRelease, scheduledRelease]
    releasesMock.byId = new Map(releasesMock.data.map((release) => [release._id, release]))
    variantsStore = createMockVariantsStore()
    // The store lists the duplicate once the listener reports it, which the dialog waits for
    variantOperationsMock.createVariant.mockImplementation(async (variant) => {
      variantsStore.list(variant)
      return {transactionId: 'create'}
    })
    variantDocumentOperationsMock.duplicateVariantDocuments.mockResolvedValue({
      transactionId: 'documents',
    })
  })

  const renderDialog = async (documentCount?: number | null) => {
    const wrapper = await createTestProvider({
      config: {
        schema: {
          types: [
            defineType({
              name: 'article',
              type: 'document',
              fields: [defineField({name: 'title', type: 'string'})],
            }),
          ],
        },
      },
      resources: [variantsUsEnglishLocaleBundle],
    })
    render(
      <DuplicateVariantDialog
        documentCount={documentCount}
        onCancel={onCancel}
        onDuplicated={onDuplicated}
        variant={variantAlphaAudience}
      />,
      {wrapper},
    )
    return screen.findByRole('dialog', {name: 'Duplicate variant definition'})
  }

  const makeConditionsUnique = async (
    user: ReturnType<typeof userEvent.setup>,
    dialog: HTMLElement,
  ) => {
    const conditionValues = await within(dialog).findAllByTestId('variant-form-condition-value')
    await user.clear(conditionValues[0]!)
    await user.type(conditionValues[0]!, 'beta')
  }

  const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
    const dialog = await renderDialog(DOCUMENTS.length)
    await makeConditionsUnique(user, dialog)
    await user.click(within(dialog).getByTestId('duplicate-variant-button'))
    return screen.findByRole('dialog', {name: 'Duplicate also the variant documents?'})
  }

  it('prefills the form from the original with "(duplicated)" in the title', async () => {
    const dialog = await renderDialog(0)

    expect(within(dialog).getByTestId('variant-form-title')).toHaveValue(
      'Alpha audience (duplicated)',
    )
    // The condition rows render once the (freeform) conditions config has resolved
    const conditionKeys = await within(dialog).findAllByTestId('variant-form-condition-key')
    expect(conditionKeys.map((input) => (input as HTMLInputElement).value)).toEqual([
      'audience',
      'locale',
    ])
    expect(
      within(dialog)
        .getAllByTestId('variant-form-condition-value')
        .map((input) => (input as HTMLInputElement).value),
    ).toEqual(['alpha', 'en-US'])
    expect(within(dialog).getByTestId('variant-form-priority')).toHaveValue(
      variantAlphaAudience.priority,
    )
  })

  it('blocks creating the duplicate until its conditions differ from the original', async () => {
    const user = userEvent.setup()
    const dialog = await renderDialog(0)

    // As in the create dialog, the validation messages appear once submitting is attempted
    expect(
      within(dialog).queryByTestId('variant-form-conditions-duplicate-error'),
    ).not.toBeInTheDocument()

    await user.click(within(dialog).getByTestId('duplicate-variant-button'))

    expect(within(dialog).getByTestId('variant-form-conditions-duplicate-error')).toHaveTextContent(
      'A variant definition with the same conditions already exists: Alpha audience',
    )
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()

    await makeConditionsUnique(user, dialog)
    await user.click(within(dialog).getByTestId('duplicate-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    })
  })

  it('creates only the definition, without asking, when the original has no documents', async () => {
    const user = userEvent.setup()
    const dialog = await renderDialog(0)

    await makeConditionsUnique(user, dialog)
    await user.click(within(dialog).getByTestId('duplicate-variant-button'))

    await waitFor(() => {
      expect(onDuplicated).toHaveBeenCalledTimes(1)
    })

    const duplicate = variantOperationsMock.createVariant.mock.calls[0]![0]
    expect(duplicate).toEqual({
      _id: expect.stringMatching(/^_\.variants\./),
      _type: 'system.variant',
      conditions: {audience: 'beta', locale: 'en-US'},
      priority: variantAlphaAudience.priority,
      metadata: {title: 'Alpha audience (duplicated)', description: [], type: 'variant'},
    })
    expect(duplicate._id).not.toBe(variantAlphaAudience._id)
    expect(onDuplicated).toHaveBeenCalledWith(duplicate._id)
    expect(
      screen.queryByRole('dialog', {name: 'Duplicate also the variant documents?'}),
    ).not.toBeInTheDocument()
    expect(variantDocumentOperationsMock.duplicateVariantDocuments).not.toHaveBeenCalled()
    expect(toastMock.push).toHaveBeenCalledWith(
      expect.objectContaining({status: 'success', title: 'Variant definition duplicated'}),
    )
  })

  it('opens the duplicate only once the variants store lists it', async () => {
    const created: EditableSystemVariant[] = []
    variantOperationsMock.createVariant.mockImplementation(async (variant) => {
      created.push(variant)
      return {transactionId: 'create'}
    })
    const user = userEvent.setup()
    const dialog = await renderDialog(0)

    await makeConditionsUnique(user, dialog)
    await user.click(within(dialog).getByTestId('duplicate-variant-button'))

    await waitFor(() => {
      expect(created).toHaveLength(1)
    })
    // Opening it before the store lists it would render the detail page's not-found state
    expect(onDuplicated).not.toHaveBeenCalled()
    expect(within(dialog).getByTestId('duplicate-variant-button')).toBeDisabled()

    act(() => variantsStore.list(created[0]!))

    await waitFor(() => {
      expect(onDuplicated).toHaveBeenCalledWith(created[0]!._id)
    })
  })

  it('asks whether to copy the documents when the original has documents', async () => {
    documentsMock.results = DOCUMENTS
    const user = userEvent.setup()

    const documentsDialog = await submitForm(user)

    expect(
      within(documentsDialog).getByTestId('duplicate-variant-documents-description'),
    ).toHaveTextContent(
      '2 document versions from "Alpha audience" will be copied into the new variant definition.',
    )
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()
  })

  it('lists the versions in scheduled releases as not copied', async () => {
    documentsMock.results = DOCUMENTS
    const user = userEvent.setup()

    const documentsDialog = await submitForm(user)

    const skipped = within(documentsDialog).getAllByTestId('duplicate-variant-skipped-document')
    expect(skipped).toHaveLength(1)
    expect(skipped[0]).toHaveTextContent('Spring launch')
    expect(skipped[0]).toHaveTextContent('In the scheduled release "scheduled Release"')
  })

  it('duplicates only the definition when the documents are declined', async () => {
    documentsMock.results = DOCUMENTS
    const user = userEvent.setup()

    const documentsDialog = await submitForm(user)
    await user.click(within(documentsDialog).getByText('No, only the definition'))

    await waitFor(() => {
      expect(onDuplicated).toHaveBeenCalledTimes(1)
    })
    expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    expect(variantDocumentOperationsMock.duplicateVariantDocuments).not.toHaveBeenCalled()
    expect(onDuplicated).toHaveBeenCalledWith(
      variantOperationsMock.createVariant.mock.calls[0]![0]._id,
    )
  })

  it('creates the definition, then copies the documents in one transaction', async () => {
    documentsMock.results = DOCUMENTS
    const user = userEvent.setup()

    const documentsDialog = await submitForm(user)
    await user.click(within(documentsDialog).getByTestId('duplicate-variant-documents-button'))

    await waitFor(() => {
      expect(onDuplicated).toHaveBeenCalledTimes(1)
    })

    const duplicate = variantOperationsMock.createVariant.mock.calls[0]![0]
    expect(variantDocumentOperationsMock.duplicateVariantDocuments).toHaveBeenCalledTimes(1)
    expect(variantDocumentOperationsMock.duplicateVariantDocuments).toHaveBeenCalledWith({
      variant: duplicate,
      documents: [
        {
          documentGroupId: 'article-1',
          baseId: 'drafts.scope-draft.article-1',
          perspective: 'drafts',
        },
        {
          documentGroupId: 'article-2',
          baseId: 'versions.rASAP.scope.article-2',
          perspective: 'rASAP',
        },
      ],
    })
    expect(variantOperationsMock.createVariant.mock.invocationCallOrder[0]).toBeLessThan(
      variantDocumentOperationsMock.duplicateVariantDocuments.mock.invocationCallOrder[0]!,
    )
    expect(onDuplicated).toHaveBeenCalledWith(duplicate._id)
    // Clicks inside the documents dialog never reach the form dialog underneath it
    expect(onCancel).not.toHaveBeenCalled()
    expect(toastMock.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        title: 'Variant definition duplicated',
        description: '2 document versions were copied. 1 document version was not copied.',
      }),
    )
  })

  it('opens the duplicate and reports it when copying the documents fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const error = new Error('transaction failed')
    variantDocumentOperationsMock.duplicateVariantDocuments.mockRejectedValue(error)
    documentsMock.results = DOCUMENTS
    const user = userEvent.setup()

    const documentsDialog = await submitForm(user)
    await user.click(within(documentsDialog).getByTestId('duplicate-variant-documents-button'))

    await waitFor(() => {
      expect(onDuplicated).toHaveBeenCalledTimes(1)
    })
    expect(consoleError).toHaveBeenCalledWith(error)
    expect(toastMock.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        title: 'The variant definition was duplicated, but its documents could not be copied',
      }),
    )
    expect(toastMock.push).not.toHaveBeenCalledWith(expect.objectContaining({status: 'success'}))

    consoleError.mockRestore()
  })

  it('keeps the form open when creating the definition fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const error = new Error('create failed')
    variantOperationsMock.createVariant.mockRejectedValue(error)
    documentsMock.results = DOCUMENTS
    const user = userEvent.setup()

    const documentsDialog = await submitForm(user)
    await user.click(within(documentsDialog).getByTestId('duplicate-variant-documents-button'))

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(
        expect.objectContaining({status: 'error', title: 'Unable to duplicate variant definition'}),
      )
    })
    expect(consoleError).toHaveBeenCalledWith(error)
    expect(variantDocumentOperationsMock.duplicateVariantDocuments).not.toHaveBeenCalled()
    expect(onDuplicated).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', {name: 'Duplicate also the variant documents?'}),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByRole('dialog', {name: 'Duplicate variant definition'})).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('returns to the form with its values when the documents dialog is closed', async () => {
    documentsMock.results = DOCUMENTS
    const user = userEvent.setup()

    const documentsDialog = await submitForm(user)
    await user.click(within(documentsDialog).getByLabelText('Close dialog'))

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', {name: 'Duplicate also the variant documents?'}),
      ).not.toBeInTheDocument()
    })
    const dialog = screen.getByRole('dialog', {name: 'Duplicate variant definition'})
    expect(within(dialog).getAllByTestId('variant-form-condition-value')[0]).toHaveValue('beta')
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('waits for the documents to load before they can be copied', async () => {
    documentsMock.loading = true
    const user = userEvent.setup()

    const documentsDialog = await submitForm(user)

    expect(
      within(documentsDialog).getByTestId('duplicate-variant-documents-loading'),
    ).toHaveTextContent('Loading documents')
    expect(within(documentsDialog).getByTestId('duplicate-variant-documents-button')).toBeDisabled()
    expect(within(documentsDialog).getByText('No, only the definition')).toBeEnabled()
  })
})
