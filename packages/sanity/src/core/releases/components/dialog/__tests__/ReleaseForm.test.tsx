import {type EditableReleaseDocument, type ReleaseDocument} from '@sanity/client'
import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useDateTimeFormat} from '../../../../hooks'
import {useActiveReleases} from '../../../store'
import {RELEASE_DOCUMENT_TYPE} from '../../../store/constants'
import {useReleasesIds} from '../../../store/useReleasesIds'
import {ReleaseForm} from '../ReleaseForm'

vi.mock('../../../../../core/hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: vi.fn(),
}))
vi.mock('../../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(),
}))

vi.mock('../../../store/useReleasesIds', () => ({
  useReleasesIds: vi.fn(),
}))

vi.mock('../../../i18n/hooks/useTranslation', () => ({
  useTranslate: vi.fn().mockReturnValue({
    t: vi.fn(),
  }),
}))

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseReleasesIds = useReleasesIds as Mock<typeof useReleasesIds>
const mockUseDateTimeFormat = useDateTimeFormat as Mock

describe('ReleaseForm', () => {
  const onChangeMock = vi.fn()
  const onErrorMock = vi.fn()
  const valueMock: EditableReleaseDocument = {
    _id: 'very-random',
    metadata: {
      title: '',
      description: '',
    },
  }

  describe('when creating a new release', () => {
    beforeEach(async () => {
      onChangeMock.mockClear()
      onErrorMock.mockClear()

      // Mock the data returned by useBundles hook
      const mockData: ReleaseDocument[] = [
        {
          _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
          _type: RELEASE_DOCUMENT_TYPE,
          _createdAt: '2024-07-02T11:37:51Z',
          _updatedAt: '2024-07-12T10:39:32Z',
          name: 'spring-drop',
          createdBy: 'unknown',
          state: 'active',
          metadata: {
            releaseType: 'asap',
            title: 'Spring Drop',
            description: 'What a spring drop, allergies galore 🌸',
          },
          _rev: '',
        },
        // Add more mock data if needed
      ]
      mockUseActiveReleases.mockReturnValue({
        data: mockData,
        loading: false,
        dispatch: vi.fn(),
        error: undefined,
      })

      mockUseReleasesIds.mockReturnValue({
        releasesIds: [],
      })

      mockUseDateTimeFormat.mockReturnValue({format: vi.fn().mockReturnValue('Mocked date')})

      const wrapper = await createTestProvider()
      render(<ReleaseForm onChange={onChangeMock} value={valueMock} />, {
        wrapper,
      })
    })

    it('should render the form fields', () => {
      expect(screen.getByTestId('release-form-title')).toBeInTheDocument()
      expect(screen.getByTestId('release-form-description')).toBeInTheDocument()
      //expect(screen.getByTestId('release-form-publish-at')).toBeInTheDocument()
    })

    it('should call onChange when title input value changes', () => {
      const titleInput = screen.getByTestId('release-form-title')
      fireEvent.change(titleInput, {target: {value: 'Bundle 1'}})

      expect(onChangeMock).toHaveBeenCalledWith({
        ...valueMock,
        metadata: {...valueMock.metadata, title: 'Bundle 1'},
      })
    })

    it('should call onChange when description textarea value changes', () => {
      const descriptionTextarea = screen.getByTestId('release-form-description')
      fireEvent.change(descriptionTextarea, {target: {value: 'New Description'}})

      expect(onChangeMock).toHaveBeenCalledWith({
        ...valueMock,
        metadata: {...valueMock.metadata, description: 'New Description'},
      })
    })
  })

  describe('when updating an existing release', () => {
    const existingBundleValue: ReleaseDocument = {
      _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
      _type: RELEASE_DOCUMENT_TYPE,
      _createdAt: '2024-07-02T11:37:51Z',
      _updatedAt: '2024-07-12T10:39:32Z',
      name: 'spring-drop',
      createdBy: 'unknown',
      state: 'active',
      metadata: {
        title: 'Summer Drop',
        description: 'Summer time',
        releaseType: 'asap',
      },
      _rev: '',
    }
    beforeEach(async () => {
      onChangeMock.mockClear()
      onErrorMock.mockClear()

      // Mock the data returned by useBundles hook
      const mockData: ReleaseDocument[] = [
        {
          _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
          _type: RELEASE_DOCUMENT_TYPE,
          _createdAt: '2024-07-02T11:37:51Z',
          _updatedAt: '2024-07-12T10:39:32Z',
          name: 'spring-drop',
          createdBy: 'unknown',
          state: 'active',
          metadata: {
            releaseType: 'asap',
            title: 'Spring Drop',
            description: 'What a spring drop, allergies galore 🌸',
          },
          _rev: '',
        },
      ]
      mockUseActiveReleases.mockReturnValue({
        data: mockData,
        loading: false,
        dispatch: vi.fn(),
        error: undefined,
      })

      mockUseReleasesIds.mockReturnValue({
        releasesIds: [],
      })

      mockUseDateTimeFormat.mockReturnValue({format: vi.fn().mockReturnValue('Mocked date')})

      const wrapper = await createTestProvider()
      render(<ReleaseForm onChange={onChangeMock} value={existingBundleValue} />, {
        wrapper,
      })
    })

    it('should allow for any title to be used', async () => {
      const titleInput = screen.getByTestId('release-form-title')
      expect(titleInput).toHaveValue(existingBundleValue.metadata.title)
      // the slug of this title already exists,
      // but the slug for the existing edited release will not be changed
      fireEvent.change(titleInput, {target: {value: 'Spring Drop'}})

      expect(screen.queryByTestId('input-validation-icon-error')).not.toBeInTheDocument()
    })

    it('should populate the form with the existing release values', () => {
      expect(screen.getByTestId('release-form-title')).toHaveValue(
        existingBundleValue.metadata.title,
      )
      expect(screen.getByTestId('release-form-description')).toHaveValue(
        existingBundleValue.metadata.description,
      )
    })
  })
})
