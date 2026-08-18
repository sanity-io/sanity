import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {PresentationNarrowTabBar} from '../PresentationNarrowTabBar'

async function renderTabBar(props: {
  activeTab?: 'preview' | 'navigator' | 'content'
  navigatorEnabled?: boolean
  onTabChange?: (tab: 'preview' | 'navigator' | 'content') => void
}) {
  const wrapper = await createTestProvider({
    resources: [presentationUsEnglishLocaleBundle],
  })

  return render(
    <PresentationNarrowTabBar
      activeTab={props.activeTab ?? 'preview'}
      navigatorEnabled={props.navigatorEnabled ?? false}
      onTabChange={props.onTabChange ?? vi.fn()}
    />,
    {wrapper},
  )
}

describe('PresentationNarrowTabBar', () => {
  it('renders the preview and structure tabs but not the navigator when it is disabled', async () => {
    await renderTabBar({navigatorEnabled: false})

    // The locale bundle loads via a lazy import, so wait for the labels to resolve.
    expect(await screen.findByRole('tab', {name: 'Presentation'})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: 'Structure'})).toBeInTheDocument()
    expect(screen.queryByRole('tab', {name: 'Navigator'})).not.toBeInTheDocument()
  })

  it('renders the navigator tab between preview and structure when it is enabled', async () => {
    await renderTabBar({navigatorEnabled: true})

    await screen.findByRole('tab', {name: 'Presentation'})
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent)
    expect(tabs).toEqual(['Presentation', 'Navigator', 'Structure'])
  })

  it('marks the active tab as selected', async () => {
    await renderTabBar({activeTab: 'content'})

    expect(await screen.findByRole('tab', {name: 'Structure'})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', {name: 'Presentation'})).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('calls onTabChange with the selected tab id when a tab is clicked', async () => {
    const onTabChange = vi.fn()
    await renderTabBar({navigatorEnabled: true, onTabChange})

    await userEvent.click(await screen.findByRole('tab', {name: 'Structure'}))
    expect(onTabChange).toHaveBeenCalledWith('content')

    await userEvent.click(screen.getByRole('tab', {name: 'Navigator'}))
    expect(onTabChange).toHaveBeenCalledWith('navigator')
  })
})
