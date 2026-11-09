import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useUpsellData} from '../../../../hooks/useUpsellData'
import {type UpsellData} from '../../../../studio/upsell/types'
import {ReleasesUpsellProvider} from '../ReleasesUpsellProvider'
import {useReleasesUpsell} from '../useReleasesUpsell'

// `createTestProvider` mocks the `useUpsellData` module; the observable it returns is set per test
const useUpsellDataMock = vi.mocked(useUpsellData)

const telemetryLogs = {
  dialogViewed: vi.fn(),
  dialogDismissed: vi.fn(),
  dialogPrimaryClicked: vi.fn(),
  dialogSecondaryClicked: vi.fn(),
  panelViewed: vi.fn(),
  panelDismissed: vi.fn(),
  panelPrimaryClicked: vi.fn(),
  panelSecondaryClicked: vi.fn(),
}

const upsellData: UpsellData = {
  _createdAt: '2024-01-01',
  _id: 'journey-content-releases',
  _rev: '1',
  _type: 'journey',
  _updatedAt: '2024-01-01',
  id: 'journey-content-releases',
  image: null,
  descriptionText: [
    {
      _type: 'block',
      _key: 'a',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 'a1',
          text: 'You can have {{releaseLimit}} active releases',
          marks: [],
        },
      ],
    },
  ],
  ctaButton: {text: 'Upgrade plan', url: 'https://www.sanity.io/manage'},
  secondaryButton: {text: 'Learn more', url: 'https://www.sanity.io/docs'},
}

beforeEach(() => {
  useUpsellDataMock.mockReturnValue({
    upsellData$: of({upsellData, hasError: false}),
    telemetryLogs,
  })
})

function Harness() {
  const {onReleaseLimitReached} = useReleasesUpsell()
  return (
    <button type="button" onClick={() => onReleaseLimitReached(4)}>
      reached
    </button>
  )
}

describe('ReleasesUpsellProvider', () => {
  it('opens the shared upsell dialog when the release limit is reached, with the limit in the copy', async () => {
    const TestProvider = await createTestProvider()
    render(
      <ReleasesUpsellProvider>
        <Harness />
      </ReleasesUpsellProvider>,
      {wrapper: TestProvider},
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', {name: 'reached'}))

    expect(await screen.findByRole('dialog')).toHaveTextContent('You can have 4 active releases')
    expect(telemetryLogs.dialogViewed).toHaveBeenCalledWith('navbar')
  })
})
