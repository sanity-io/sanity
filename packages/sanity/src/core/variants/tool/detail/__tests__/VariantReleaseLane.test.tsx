import {type ReleaseDocument} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type ReleaseLaneSegment} from '../releaseLane'
import {VariantReleaseLane} from '../VariantReleaseLane'

const summerRelease = {
  _id: '_.releases.rSummer',
  metadata: {title: 'Summer launch'},
} as ReleaseDocument

const segments: ReleaseLaneSegment[] = [
  {id: 'published', kind: 'published', count: 2},
  {id: 'drafts', kind: 'drafts', count: 1},
  {id: summerRelease._id, kind: 'release', release: summerRelease, count: 1},
]

const renderLane = async (props: Partial<React.ComponentProps<typeof VariantReleaseLane>> = {}) => {
  const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
  const onSelectLane = props.onSelectLane ?? vi.fn()
  render(
    <VariantReleaseLane
      activeLane={props.activeLane ?? 'all'}
      onSelectLane={onSelectLane}
      segments={props.segments ?? segments}
      totalCount={props.totalCount ?? 3}
    />,
    {wrapper},
  )
  return {onSelectLane}
}

describe('VariantReleaseLane', () => {
  it('renders an "All" segment plus one segment per bundle with counts', async () => {
    await renderLane({totalCount: 4})

    // createTestProvider loads i18n asynchronously; wait for the lane to mount.
    await screen.findByTestId('variant-release-lane')
    expect(screen.getByText('Releases')).toBeInTheDocument()
    expect(screen.getByText('All · 4')).toBeInTheDocument()
    expect(screen.getByText('Published · 2')).toBeInTheDocument()
    expect(screen.getByText('Draft · 1')).toBeInTheDocument()
    expect(screen.getByText('Summer launch · 1')).toBeInTheDocument()
  })

  it('calls onSelectLane with the segment id when a segment is clicked', async () => {
    const user = userEvent.setup()
    const {onSelectLane} = await renderLane()

    await user.click(await screen.findByTestId('variant-release-lane-segment-published'))

    expect(onSelectLane).toHaveBeenCalledWith('published')
  })

  it('marks the active segment as selected', async () => {
    await renderLane({activeLane: 'published'})

    expect(await screen.findByTestId('variant-release-lane-segment-published')).toHaveAttribute(
      'data-selected',
    )
  })

  it('renders nothing when there is only one bundle to filter by', async () => {
    await renderLane({segments: [segments[0]!]})

    expect(screen.queryByTestId('variant-release-lane')).not.toBeInTheDocument()
  })
})
