import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type ReleaseDocument} from '../../../index'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {ReleaseDetailsEditor} from '../ReleaseDetailsEditor'
// Mock the dependencies
vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn().mockReturnValue({
    updateRelease: vi.fn(),
  }),
}))

describe('ReleaseDetailsEditor', () => {
  beforeEach(async () => {
    const initialRelease = {
      _id: 'release1',
      metadata: {
        title: 'Initial Title',
        description: '',
        releaseType: 'asap',
        intendedPublishAt: undefined,
      },
    } as ReleaseDocument
    const wrapper = await createTestProvider()
    render(<ReleaseDetailsEditor release={initialRelease} />, {wrapper})
  })

  it('should call updateRelease after title change', () => {
    const release = {
      _id: 'release1',
      metadata: {
        title: 'New Title',
        description: '',
        releaseType: 'asap',
        intendedPublishAt: undefined,
      },
    } as ReleaseDocument

    const input = screen.getByTestId('release-form-title')
    fireEvent.change(input, {target: {value: release.metadata.title}})

    waitFor(
      () => {
        expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith(release)
      },
      {timeout: 250},
    )
  })

  it('should call updateRelease after description change', () => {
    const release = {
      _id: 'release1',
      metadata: {
        title: 'Initial Title',
        description: 'woo hoo',
        releaseType: 'asap',
        intendedPublishAt: undefined,
      },
    } as ReleaseDocument

    const input = screen.getByTestId('release-form-description')
    fireEvent.change(input, {target: {value: release.metadata.description}})

    waitFor(
      () => {
        expect(useReleaseOperations().updateRelease).toHaveBeenCalledWith(release)
      },
      {timeout: 250},
    )
  })
})
