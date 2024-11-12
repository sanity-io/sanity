import {fireEvent, render, screen} from '@testing-library/react'
import {act} from 'react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useDateTimeFormat} from '../../../../hooks'
import {studioDefaultLocaleResources} from '../../../../i18n/bundles/studio'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {type EditableReleaseDocument, type ReleaseDocument, useReleases} from '../../../store'
import {RELEASE_DOCUMENT_TYPE} from '../../../store/constants'
import {TitleDescriptionForm} from '../TitleDescriptionForm'

vi.mock('../../../../../core/hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: vi.fn(),
}))
vi.mock('../../../store/useReleases', () => ({
  useReleases: vi.fn(),
}))

const mockUseReleases = useReleases as Mock<typeof useReleases>
const mockUseDateTimeFormat = useDateTimeFormat as Mock

describe('TitleDescriptionForm', () => {
  const onChangeMock = vi.fn()
  const onErrorMock = vi.fn()
  const valueMock: EditableReleaseDocument = {
    _id: 'very-random',
    metadata: {
      title: '',
      description: '',
      intendedPublishAt: undefined,
      releaseType: 'asap',
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
        },
        // Add more mock data if needed
      ]
      mockUseReleases.mockReturnValue({
        data: mockData,
        loading: false,
        dispatch: vi.fn(),
        error: undefined,
        archivedReleases: [],
        releasesIds: [],
      })

      mockUseDateTimeFormat.mockReturnValue({format: vi.fn().mockReturnValue('Mocked date')})

      const wrapper = await createTestProvider({
        resources: [releasesUsEnglishLocaleBundle, studioDefaultLocaleResources],
      })
      render(<TitleDescriptionForm onChange={onChangeMock} release={valueMock} />, {
        wrapper,
      })
    })

    it('should render the form fields', () => {
      expect(screen.getByTestId('release-form-title')).toBeInTheDocument()
      expect(screen.getByTestId('release-form-description')).toBeInTheDocument()
    })

    it('should call onChange when title input value changes', () => {
      const titleInput = screen.getByTestId('release-form-title')

      act(() => {
        fireEvent.change(titleInput, {target: {value: 'Bundle 1'}})
      })

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
})
