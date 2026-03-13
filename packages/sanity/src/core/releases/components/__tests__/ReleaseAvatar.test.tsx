import {render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
  scheduledRelease,
} from '../../__fixtures__/release.fixture'
import {LATEST, PUBLISHED} from '../../util/const'
import {ReleaseAvatarIcon} from '../ReleaseAvatar'

describe('ReleaseAvatarIcon', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('renders BoltIcon for ASAP releases', () => {
    render(<ReleaseAvatarIcon release={activeASAPRelease} />)

    expect(screen.getByTestId('release-avatar-caution')).toHaveAttribute('data-sanity-icon', 'bolt')
  })

  it('renders ClockIcon for scheduled releases', () => {
    render(<ReleaseAvatarIcon release={scheduledRelease} />)

    expect(screen.getByTestId('release-avatar-suggest')).toHaveAttribute(
      'data-sanity-icon',
      'clock',
    )
  })

  it('renders ClockIcon for paused cardinality-one releases', () => {
    const pausedRelease = {
      ...activeScheduledRelease,
      metadata: {
        ...activeScheduledRelease.metadata,
        cardinality: 'one' as const,
        intendedPublishAt: '2023-10-10T10:00:00.000Z',
      },
    }

    render(<ReleaseAvatarIcon release={pausedRelease} />)

    expect(screen.getByTestId('release-avatar-caution')).toHaveAttribute(
      'data-sanity-icon',
      'clock',
    )
  })

  it('renders DotIcon for undecided releases', () => {
    render(<ReleaseAvatarIcon release={activeUndecidedRelease} />)

    expect(screen.getByTestId('release-avatar-neutral')).toHaveAttribute('data-sanity-icon', 'dot')
  })

  it('renders DotIcon with caution tone for drafts perspective', () => {
    render(<ReleaseAvatarIcon release={LATEST} />)

    expect(screen.getByTestId('release-avatar-caution')).toHaveAttribute('data-sanity-icon', 'dot')
  })

  it('renders DotIcon with positive tone for published perspective', () => {
    render(<ReleaseAvatarIcon release={PUBLISHED} />)

    expect(screen.getByTestId('release-avatar-positive')).toHaveAttribute('data-sanity-icon', 'dot')
  })
})
