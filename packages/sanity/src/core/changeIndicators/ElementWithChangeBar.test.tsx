import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {ChangeIndicator} from './ChangeIndicator'
import {ChangeConnectorRoot} from './overlay/ChangeConnectorRoot'

function Harness(props: {
  isInteractive?: boolean
  isReviewChangesEnabled?: boolean
  isChanged: boolean
}) {
  const {isInteractive, isReviewChangesEnabled, isChanged} = props

  return (
    <ChangeConnectorRoot
      isInteractive={isInteractive}
      isReviewChangesEnabled={isReviewChangesEnabled}
      isReviewChangesOpen={false}
      onOpenReviewChanges={() => {}}
      onSetFocus={() => {}}
    >
      <ChangeIndicator hasFocus isChanged={isChanged} path={['title']}>
        <div>field</div>
      </ChangeIndicator>
    </ChangeConnectorRoot>
  )
}

describe('ElementWithChangeBar', () => {
  it('renders a marker and a button when interactive', async () => {
    const TestProvider = await createTestProvider()

    render(<Harness isChanged />, {wrapper: TestProvider})

    expect(screen.getByTestId('change-bar__marker')).toBeInTheDocument()
    expect(screen.getByTestId('change-bar__button')).toBeInTheDocument()
  })

  it('renders a marker but no button when review changes is enabled but not interactive (collapsed layout)', async () => {
    const TestProvider = await createTestProvider()

    render(<Harness isReviewChangesEnabled isInteractive={false} isChanged />, {
      wrapper: TestProvider,
    })

    expect(screen.getByTestId('change-bar__marker')).toBeInTheDocument()
    expect(screen.queryByTestId('change-bar__button')).not.toBeInTheDocument()
  })

  it('renders neither a marker nor a button when not changed', async () => {
    const TestProvider = await createTestProvider()

    render(<Harness isChanged={false} />, {wrapper: TestProvider})

    expect(screen.queryByTestId('change-bar__marker')).not.toBeInTheDocument()
    expect(screen.queryByTestId('change-bar__button')).not.toBeInTheDocument()
  })

  it('renders neither a marker nor a button when review changes is not enabled, even if changed', async () => {
    const TestProvider = await createTestProvider()

    render(<Harness isReviewChangesEnabled={false} isChanged />, {wrapper: TestProvider})

    expect(screen.queryByTestId('change-bar__marker')).not.toBeInTheDocument()
    expect(screen.queryByTestId('change-bar__button')).not.toBeInTheDocument()
  })
})
