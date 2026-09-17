import {type ObjectSchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type TargetDocumentState, useDocumentOperation} from 'sanity'
import {beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {ObsoleteDraftBanner} from '../ObsoleteDraftBanner'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentOperation: vi.fn(),
}))

vi.mock('../../../useDocumentPane')

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => ({log: vi.fn()})),
}))

const mockUseDocumentOperation = useDocumentOperation as Mock<typeof useDocumentOperation>
const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>

const DOCUMENT_ID = 'doc-1'
const schemaType = {
  name: 'author',
  title: 'Author',
  jsonType: 'object',
} as ObjectSchemaType

const displayed = {
  _id: `drafts.${DOCUMENT_ID}`,
  _type: 'author',
}

const readyTarget = {
  status: 'ready' as const,
  targetDocument: {_id: `drafts.${DOCUMENT_ID}`},
  scopeId: undefined,
  variant: undefined,
  siblings: {
    published: {_id: DOCUMENT_ID},
    draft: {_id: `drafts.${DOCUMENT_ID}`, _system: {bundleId: 'drafts'}},
    version: undefined,
  },
} as unknown as TargetDocumentState

function mockOperations({
  publishDisabled = false,
  discardDisabled = false,
}: {
  publishDisabled?: false | string
  discardDisabled?: false | string
} = {}) {
  mockUseDocumentOperation.mockReturnValue({
    publish: {disabled: publishDisabled, execute: vi.fn()},
    discardChanges: {disabled: discardDisabled, execute: vi.fn()},
  } as unknown as ReturnType<typeof useDocumentOperation>)
}

async function hoverButton(name: string) {
  const button = await screen.findByRole('button', {name})
  // The tooltip is on the wrapper span so disabled buttons still receive hover.
  // oxlint-disable-next-line testing-library/no-node-access -- hover the tooltip wrapper, not the disabled button
  await userEvent.hover(button.parentElement!)
}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
  })
})

describe('ObsoleteDraftBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDocumentPane.mockReturnValue({
      targetDocumentState: readyTarget,
    } as ReturnType<typeof useDocumentPane>)
  })

  it('shows the publish action disabled reason on the publish button', async () => {
    mockOperations({publishDisabled: 'TARGET_NOT_FOUND'})

    render(
      <ObsoleteDraftBanner
        displayed={displayed}
        documentId={DOCUMENT_ID}
        schemaType={schemaType}
        i18nKey="banners.obsolete-draft.draft-model-inactive.text"
      />,
      {wrapper},
    )

    expect(await screen.findByRole('button', {name: 'Publish draft'})).toBeDisabled()

    await hoverButton('Publish draft')
    expect(
      await screen.findByText('The selected release or variant does not contain this document'),
    ).toBeInTheDocument()
  })

  it('shows the discard action disabled reason on the discard button', async () => {
    mockOperations({discardDisabled: 'NOT_PUBLISHED'})

    render(
      <ObsoleteDraftBanner
        displayed={displayed}
        documentId={DOCUMENT_ID}
        schemaType={schemaType}
        i18nKey="banners.obsolete-draft.draft-model-inactive.text"
      />,
      {wrapper},
    )

    expect(await screen.findByRole('button', {name: 'Discard draft'})).toBeDisabled()

    await hoverButton('Discard draft')
    expect(await screen.findByText('This document is not published')).toBeInTheDocument()
  })

  it('prefers the action disabled reason over the live-edit continue-editing tooltip', async () => {
    mockOperations({publishDisabled: 'LIVE_EDIT_ENABLED'})

    render(
      <ObsoleteDraftBanner
        displayed={displayed}
        documentId={DOCUMENT_ID}
        schemaType={schemaType}
        i18nKey="banners.live-edit-draft-banner.text"
        isEditBlocking
      />,
      {wrapper},
    )

    await hoverButton('Publish draft')
    expect(
      await screen.findByText('Cannot publish since Live Edit is enabled for this document type'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Publish draft to continue editing.')).not.toBeInTheDocument()
  })

  it('keeps the live-edit continue-editing tooltip when the action is enabled', async () => {
    mockOperations()

    render(
      <ObsoleteDraftBanner
        displayed={displayed}
        documentId={DOCUMENT_ID}
        schemaType={schemaType}
        i18nKey="banners.live-edit-draft-banner.text"
        isEditBlocking
      />,
      {wrapper},
    )

    expect(await screen.findByRole('button', {name: 'Publish draft'})).toBeEnabled()

    await hoverButton('Publish draft')
    expect(await screen.findByText('Publish draft to continue editing.')).toBeInTheDocument()
  })
})
