import {render} from '@testing-library/react'
import {beforeEach, describe, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useDateTimeFormat} from '../../../../hooks'
import {studioDefaultLocaleResources} from '../../../../i18n/bundles/studio'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {type EditableReleaseDocument, type ReleaseDocument, useReleases} from '../../../store'
import {RELEASE_DOCUMENT_TYPE} from '../../../store/constants'
import {ReleaseForm} from '../ReleaseForm'

vi.mock('../../../../../core/hooks/useDateTimeFormat', () => ({
  useDateTimeFormat: vi.fn(),
}))
vi.mock('../../../store/useReleases', () => ({
  useReleases: vi.fn(),
}))

const mockUseReleases = useReleases as Mock<typeof useReleases>
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

  describe.todo('when creating a new release', () => {
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
      render(<ReleaseForm onChange={onChangeMock} value={valueMock} />, {
        wrapper,
      })
    })

    it.todo('should call onChange when changing the releaseType', () => {})
    it.todo('should show the date input when the release type is changed to "At time"', () => {})

    /*
    it('should call onChange when publishAt input value changes', () => {
    const publishAtInput = screen.getByTestId('release-form-publish-at')
    fireEvent.change(publishAtInput, {target: {value: '2022-01-01'}})

    expect(onChangeMock).toHaveBeenCalledWith({...valueMock, publishAt: '2022-01-01'})
  })*/
  })
})
