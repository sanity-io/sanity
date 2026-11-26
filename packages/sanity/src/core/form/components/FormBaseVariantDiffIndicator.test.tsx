import {render, screen} from '@testing-library/react'
import {BaseVariantComparisonContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {FormBaseVariantDiffIndicator} from './FormBaseVariantDiffIndicator'

vi.mock('../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))

async function renderMark(compared: string | undefined) {
  const wrapper = await createTestProvider()
  render(
    <BaseVariantComparisonContext.Provider value={compared}>
      <FormBaseVariantDiffIndicator changedFromBaseVariant />
    </BaseVariantComparisonContext.Provider>,
    {wrapper},
  )
}

function tooltipText(): string {
  return screen.getAllByTestId('base-variant-diff-tooltip')[0].textContent ?? ''
}

describe('FormBaseVariantDiffIndicator tooltip', () => {
  beforeEach(() => {
    ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
      data: [],
      byId: new Map(),
      loading: false,
      error: undefined,
    } as unknown as ReturnType<typeof useActiveReleases>)
  })

  it('names the Draft when the draft was compared', async () => {
    await renderMark('drafts')
    expect(tooltipText()).toContain('Draft')
  })

  it('names the Published version when it was compared', async () => {
    await renderMark('published')
    expect(tooltipText()).toContain('Published')
  })

  it('does not read Draft for a release that is not among the active releases', async () => {
    await renderMark('rUnknown')
    expect(tooltipText()).toContain('rUnknown')
    expect(tooltipText()).not.toContain('Draft')
  })
})
