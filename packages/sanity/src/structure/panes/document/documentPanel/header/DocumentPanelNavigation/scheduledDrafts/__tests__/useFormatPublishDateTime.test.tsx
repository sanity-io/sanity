import {renderHook} from '@testing-library/react'
import {beforeAll, describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {createRelease} from '../../__tests__/fixtures'
import {useFormatPublishDateTime} from '../useFormatPublishDateTime'

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('useFormatPublishDateTime', () => {
  it('formats the publish date with its time, also for dates far away', () => {
    const {result} = renderHook(() => useFormatPublishDateTime(), {wrapper})

    // Mid-month at noon, so the day is the same in every time zone.
    const formatted = result.current(
      createRelease('rTest', 'Test', {
        releaseType: 'scheduled',
        intendedPublishAt: '2027-06-15T12:00:00Z',
      }),
    )

    expect(formatted).toMatch(/Jun 15, 2027/)
    expect(formatted).toMatch(/\d{1,2}:\d{2}/)
  })

  it('returns undefined for a release with no publish date', () => {
    const {result} = renderHook(() => useFormatPublishDateTime(), {wrapper})

    expect(
      result.current(createRelease('rTest', 'Test', {releaseType: 'undecided'})),
    ).toBeUndefined()
  })
})
