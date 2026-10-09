import {render, screen} from '@testing-library/react'
import {act} from 'react'
import {type ObservablePromise} from 'react-rx'
import {DocumentLimitUpsellContext, type DocumentLimitUpsellContextValue} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type UpsellData, type UpsellDataResult} from '../../../../studio/upsell/types'
import {DocumentLimitsUpsellPanel} from '../DocumentLimitsUpsellPanel'

const upsellData: UpsellData = {
  _createdAt: '2024-01-01',
  _id: 'journey-document-limit',
  _rev: '1',
  _type: 'journey',
  _updatedAt: '2024-01-01',
  id: 'journey-document-limit',
  image: null,
  descriptionText: [
    {
      _type: 'block',
      _key: 'a',
      style: 'normal',
      markDefs: [],
      children: [
        {_type: 'span', _key: 'a1', text: 'You have reached the document limit', marks: []},
      ],
    },
  ],
  ctaButton: {text: 'Upgrade plan', url: 'https://www.sanity.io/manage'},
  secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
}

/** What the provider's promise reads as once the request has answered (settled stand-ins are for tests only) */
function settled(value: UpsellDataResult): ObservablePromise<UpsellDataResult> {
  return Object.assign(Promise.resolve(value), {status: 'fulfilled' as const, value})
}

function contextValue(upsellDataPromise: ObservablePromise<UpsellDataResult>) {
  return {
    upsellDialogOpen: false,
    handleOpenDialog: vi.fn(),
    handleClose: vi.fn(),
    upsellDataPromise,
    telemetryLogs: {
      dialogSecondaryClicked: vi.fn(),
      dialogPrimaryClicked: vi.fn(),
      panelPrimaryClicked: vi.fn(),
      panelSecondaryClicked: vi.fn(),
    },
  } satisfies DocumentLimitUpsellContextValue
}

const error = new Error('Document limit exceeded')
const onReset = vi.fn()

async function renderPanel(result: UpsellDataResult) {
  const wrapper = await createTestProvider()
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the panel reads a promise with use(); React only commits that inside an awaited act
  await act(async () => {
    render(
      <DocumentLimitUpsellContext.Provider value={contextValue(settled(result))}>
        <DocumentLimitsUpsellPanel error={error} onReset={onReset} />
      </DocumentLimitUpsellContext.Provider>,
      {wrapper},
    )
  })
}

describe('DocumentLimitsUpsellPanel', () => {
  it('renders the upsell content in place of the tool that failed on the document limit', async () => {
    await renderPanel({upsellData, hasError: false})

    expect(screen.getByText('You have reached the document limit')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Upgrade plan'})).toHaveAttribute(
      'href',
      'https://www.sanity.io/manage',
    )
    expect(screen.queryByTestId('studio-error-screen')).toBeNull()
  })

  it('shows the document limit error itself when the upsell content cannot be loaded', async () => {
    // The panel is the whole error screen for that failure, so it must never be empty
    await renderPanel({upsellData: null, hasError: true})

    expect(screen.getByTestId('studio-error-screen')).toHaveAttribute(
      'data-error',
      'Document limit exceeded',
    )
    expect(screen.queryByRole('link', {name: 'Upgrade plan'})).toBeNull()
  })
})
