import {type Mock, type Mocked} from 'vitest'

import {useReleasesMetadata} from '../../useReleasesMetadata'

export const useReleasesMetadataMockReturn: Mocked<ReturnType<typeof useReleasesMetadata>> = {
  data: null,
  error: null,
  loading: false,
}

export const mockUseReleasesMetadata = useReleasesMetadata as Mock<typeof useReleasesMetadata>
